-- Receipt scanning: a private Storage bucket for the photos, plus a
-- ReceiptScan table that keeps the original photo and Claude's raw
-- extraction separate from the confirmed Expense row, per
-- property-management-app-plan_1.md section 1 ("always an audit trail
-- back to the original receipt").

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Objects are stored at `{property_id}/{filename}`, so folder segment 1
-- is the property_id — reuse it with the same role-check helper as
-- every other table.
create policy "property members can view receipt photos"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and public.user_property_role((storage.foldername(name))[1]::uuid) is not null
  );

create policy "owners can upload receipt photos"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and public.user_property_role((storage.foldername(name))[1]::uuid) = 'owner'
  );

create policy "owners can delete receipt photos"
  on storage.objects for delete
  using (
    bucket_id = 'receipts'
    and public.user_property_role((storage.foldername(name))[1]::uuid) = 'owner'
  );

-- ─── ReceiptScan table ──────────────────────────────────────────────

create table public.receipt_scans (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  image_url text not null,
  raw_extracted_text text,
  confidence text,
  created_at timestamptz not null default now()
);

create function public.expense_property_id(p_expense_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select property_id from public.expenses where id = p_expense_id;
$$;

grant execute on function public.expense_property_id(uuid) to authenticated;

alter table public.receipt_scans enable row level security;

create policy "property members can view receipt scans"
  on public.receipt_scans for select
  using (public.user_property_role(public.expense_property_id(expense_id)) is not null);

create policy "owners can insert receipt scans"
  on public.receipt_scans for insert
  with check (public.user_property_role(public.expense_property_id(expense_id)) = 'owner');

create policy "owners can delete receipt scans"
  on public.receipt_scans for delete
  using (public.user_property_role(public.expense_property_id(expense_id)) = 'owner');
