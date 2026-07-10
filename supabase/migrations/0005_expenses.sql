-- Expenses: tracked at the property level (not per-unit), per
-- property-management-app-plan_1.md section 1. Manual entry only for
-- now; receipt-scanning (ReceiptScan table) comes in the next migration.
-- RLS matches the roles table: owner full edit, co-owner/accountant view.

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  date date not null,
  category text not null,
  amount numeric(10, 2) not null,
  description text,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "property members can view expenses"
  on public.expenses for select
  using (public.user_property_role(property_id) is not null);

create policy "owners can insert expenses"
  on public.expenses for insert
  with check (public.user_property_role(property_id) = 'owner');

create policy "owners can update expenses"
  on public.expenses for update
  using (public.user_property_role(property_id) = 'owner');

create policy "owners can delete expenses"
  on public.expenses for delete
  using (public.user_property_role(property_id) = 'owner');
