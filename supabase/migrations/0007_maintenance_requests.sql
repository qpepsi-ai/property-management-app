-- Maintenance tracking, per property-management-app-plan_1.md section 1
-- and form item 11 (which adds vendor + photos beyond the section 1
-- column list, same pattern as payments' notes field). RLS matches the
-- roles table: hidden from accountant entirely, like tenants/leases.

create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id) on delete cascade,
  date_reported date not null default current_date,
  description text not null,
  priority text not null check (priority in ('low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'resolved')),
  cost numeric(10, 2),
  vendor text,
  photo_urls text[] not null default '{}',
  resolved_date date,
  created_at timestamptz not null default now()
);

-- Track when a request moves to resolved, so we can compute average
-- resolve time on the cross-property maintenance screen.
create function public.handle_maintenance_status_change()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'resolved' and old.status <> 'resolved' then
    new.resolved_date := current_date;
  elsif new.status <> 'resolved' then
    new.resolved_date := null;
  end if;
  return new;
end;
$$;

create trigger on_maintenance_status_change
  before update on public.maintenance_requests
  for each row execute function public.handle_maintenance_status_change();

create function public.unit_property_id(p_unit_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select property_id from public.units where id = p_unit_id;
$$;

grant execute on function public.unit_property_id(uuid) to authenticated;

-- ─── Row-level security ─────────────────────────────────────────────

alter table public.maintenance_requests enable row level security;

create policy "owner or co-owner can view maintenance requests"
  on public.maintenance_requests for select
  using (public.user_property_role(public.unit_property_id(unit_id)) in ('owner', 'co-owner'));

create policy "owners can insert maintenance requests"
  on public.maintenance_requests for insert
  with check (public.user_property_role(public.unit_property_id(unit_id)) = 'owner');

create policy "owners can update maintenance requests"
  on public.maintenance_requests for update
  using (public.user_property_role(public.unit_property_id(unit_id)) = 'owner');

create policy "owners can delete maintenance requests"
  on public.maintenance_requests for delete
  using (public.user_property_role(public.unit_property_id(unit_id)) = 'owner');

-- ─── Storage: photos of the issue, separate from expense receipts ───

insert into storage.buckets (id, name, public)
values ('maintenance-photos', 'maintenance-photos', false)
on conflict (id) do nothing;

create policy "owner or co-owner can view maintenance photos"
  on storage.objects for select
  using (
    bucket_id = 'maintenance-photos'
    and public.user_property_role((storage.foldername(name))[1]::uuid) in ('owner', 'co-owner')
  );

create policy "owners can upload maintenance photos"
  on storage.objects for insert
  with check (
    bucket_id = 'maintenance-photos'
    and public.user_property_role((storage.foldername(name))[1]::uuid) = 'owner'
  );

create policy "owners can delete maintenance photos"
  on storage.objects for delete
  using (
    bucket_id = 'maintenance-photos'
    and public.user_property_role((storage.foldername(name))[1]::uuid) = 'owner'
  );
