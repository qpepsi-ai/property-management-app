-- Users, Properties, and PropertyAccess: the auth/roles foundation
-- for the property management app. See property-management-app-plan_1.md
-- sections 1 and 2 for the data model and roles this implements.

create extension if not exists pgcrypto;

-- ─── Tables ─────────────────────────────────────────────────────────

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  created_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  type text not null check (type in ('single-family', 'duplex', 'multi-unit')),
  purchase_date date,
  created_at timestamptz not null default now()
);

create table public.property_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  role text not null check (role in ('owner', 'co-owner', 'accountant')),
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

-- ─── New-user profile sync ──────────────────────────────────────────
-- Mirrors auth.users into public.users on signup so app tables can
-- foreign-key against a table we control.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Role lookup helper ─────────────────────────────────────────────
-- security definer so RLS policies can call it without re-triggering
-- RLS on property_access themselves (avoids self-referential recursion).

create function public.user_property_role(p_property_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.property_access
  where property_id = p_property_id and user_id = auth.uid()
  limit 1;
$$;

grant execute on function public.user_property_role(uuid) to authenticated;

-- ─── Property creation (bootstraps the owner grant atomically) ─────
-- Direct inserts into properties are not allowed by RLS below;
-- creating a property always goes through this function so the
-- creator is granted 'owner' access in the same transaction.

create function public.create_property(
  p_address text,
  p_type text,
  p_purchase_date date
)
returns public.properties
language plpgsql
security definer
set search_path = public
as $$
declare
  new_property public.properties;
begin
  insert into public.properties (address, type, purchase_date)
  values (p_address, p_type, p_purchase_date)
  returning * into new_property;

  insert into public.property_access (user_id, property_id, role)
  values (auth.uid(), new_property.id, 'owner');

  return new_property;
end;
$$;

grant execute on function public.create_property(text, text, date) to authenticated;

-- ─── Row-level security ─────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.properties enable row level security;
alter table public.property_access enable row level security;

-- users: everyone can see/update only their own profile row.
create policy "users can view own profile"
  on public.users for select
  using (id = auth.uid());

create policy "users can update own profile"
  on public.users for update
  using (id = auth.uid());

-- properties: visible to anyone with a property_access grant, of any
-- role (co-owner and accountant both need to view property details);
-- only an owner may edit or delete. Inserts happen via create_property().
create policy "property members can view property"
  on public.properties for select
  using (public.user_property_role(id) is not null);

create policy "owners can update property"
  on public.properties for update
  using (public.user_property_role(id) = 'owner');

create policy "owners can delete property"
  on public.properties for delete
  using (public.user_property_role(id) = 'owner');

-- property_access: a user can always see their own grants; an owner
-- can see and manage every grant on properties they own (so they can
-- invite/remove co-owners and accountants).
create policy "users can view own access grants"
  on public.property_access for select
  using (user_id = auth.uid() or public.user_property_role(property_id) = 'owner');

create policy "owners can grant access"
  on public.property_access for insert
  with check (public.user_property_role(property_id) = 'owner');

create policy "owners can update access"
  on public.property_access for update
  using (public.user_property_role(property_id) = 'owner');

create policy "owners can revoke access"
  on public.property_access for delete
  using (public.user_property_role(property_id) = 'owner');
