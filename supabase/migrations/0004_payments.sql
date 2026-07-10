-- Payments: rent tracking tied to a lease, per
-- property-management-app-plan_1.md sections 1, 2, and 3 (forms item 8).
-- Unlike tenants/leases, payments are visible (not just editable) to the
-- accountant role, matching the roles table.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null references public.leases (id) on delete cascade,
  due_date date not null,
  paid_date date,
  amount_paid numeric(10, 2) not null default 0,
  status text not null default 'paid' check (status in ('paid', 'partial')),
  notes text,
  created_at timestamptz not null default now()
);

-- ─── Helper: resolve the property a lease belongs to ────────────────

create function public.lease_property_id(p_lease_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select u.property_id
  from public.leases l
  join public.units u on u.id = l.unit_id
  where l.id = p_lease_id;
$$;

grant execute on function public.lease_property_id(uuid) to authenticated;

-- ─── Row-level security ─────────────────────────────────────────────

alter table public.payments enable row level security;

create policy "property members can view payments"
  on public.payments for select
  using (public.user_property_role(public.lease_property_id(lease_id)) is not null);

create policy "owners can insert payments"
  on public.payments for insert
  with check (public.user_property_role(public.lease_property_id(lease_id)) = 'owner');

create policy "owners can update payments"
  on public.payments for update
  using (public.user_property_role(public.lease_property_id(lease_id)) = 'owner');

create policy "owners can delete payments"
  on public.payments for delete
  using (public.user_property_role(public.lease_property_id(lease_id)) = 'owner');
