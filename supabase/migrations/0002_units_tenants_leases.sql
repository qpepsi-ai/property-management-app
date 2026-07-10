-- Units, Tenants, and Leases: the core rental data model, per
-- property-management-app-plan_1.md section 1. RLS matches the roles
-- table in section 2 — note that Tenants and Leases are entirely
-- hidden from the accountant role, not just filtered.

-- ─── Tables ─────────────────────────────────────────────────────────

create table public.units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  label text not null,
  bedrooms integer,
  bathrooms numeric(3, 1),
  rent_amount numeric(10, 2),
  status text not null default 'vacant' check (status in ('vacant', 'occupied')),
  created_at timestamptz not null default now()
);

-- Tenants aren't scoped to a property until linked to a unit via a
-- lease, so we track who created them to control visibility/edits
-- before that link exists.
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  created_by uuid not null default auth.uid() references public.users (id),
  created_at timestamptz not null default now()
);

create table public.leases (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  rent_amount numeric(10, 2) not null,
  security_deposit numeric(10, 2),
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now()
);

-- ─── Helper: does a tenant have any lease on a property the caller
-- can see as owner/co-owner? ─────────────────────────────────────────

create function public.tenant_visible_via_lease(p_tenant_id uuid, p_roles text[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.leases l
    join public.units u on u.id = l.unit_id
    where l.tenant_id = p_tenant_id
      and public.user_property_role(u.property_id) = any (p_roles)
  );
$$;

grant execute on function public.tenant_visible_via_lease(uuid, text[]) to authenticated;

-- ─── Row-level security ─────────────────────────────────────────────

alter table public.units enable row level security;
alter table public.tenants enable row level security;
alter table public.leases enable row level security;

-- units: any property member can view (accountant needs rent figures);
-- only the property owner can edit.
create policy "property members can view units"
  on public.units for select
  using (public.user_property_role(property_id) is not null);

create policy "owners can insert units"
  on public.units for insert
  with check (public.user_property_role(property_id) = 'owner');

create policy "owners can update units"
  on public.units for update
  using (public.user_property_role(property_id) = 'owner');

create policy "owners can delete units"
  on public.units for delete
  using (public.user_property_role(property_id) = 'owner');

-- tenants: hidden from accountants entirely. Visible to the owner/
-- co-owner of a property once lease-linked, or to whoever created the
-- tenant record before any lease exists. Only an owner can create,
-- edit, or delete tenants.
create policy "owner or co-owner can view tenants"
  on public.tenants for select
  using (
    created_by = auth.uid()
    or public.tenant_visible_via_lease(id, array['owner', 'co-owner'])
  );

create policy "owners can insert tenants"
  on public.tenants for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.property_access
      where user_id = auth.uid() and role = 'owner'
    )
  );

create policy "owners can update tenants"
  on public.tenants for update
  using (
    created_by = auth.uid()
    or public.tenant_visible_via_lease(id, array['owner'])
  );

create policy "owners can delete tenants"
  on public.tenants for delete
  using (
    created_by = auth.uid()
    or public.tenant_visible_via_lease(id, array['owner'])
  );

-- leases: hidden from accountants entirely, matching tenants.
create policy "owner or co-owner can view leases"
  on public.leases for select
  using (
    public.user_property_role(
      (select property_id from public.units where id = leases.unit_id)
    ) in ('owner', 'co-owner')
  );

create policy "owners can insert leases"
  on public.leases for insert
  with check (
    public.user_property_role(
      (select property_id from public.units where id = leases.unit_id)
    ) = 'owner'
  );

create policy "owners can update leases"
  on public.leases for update
  using (
    public.user_property_role(
      (select property_id from public.units where id = leases.unit_id)
    ) = 'owner'
  );

create policy "owners can delete leases"
  on public.leases for delete
  using (
    public.user_property_role(
      (select property_id from public.units where id = leases.unit_id)
    ) = 'owner'
  );

-- Creating a lease flips the unit from vacant to occupied.
create function public.handle_lease_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' then
    update public.units set status = 'occupied' where id = new.unit_id;
  end if;
  return new;
end;
$$;

create trigger on_lease_insert
  after insert on public.leases
  for each row execute function public.handle_lease_insert();
