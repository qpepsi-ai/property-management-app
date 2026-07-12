-- "Needs review" was permanent: it derives from receipt_scans.confidence
-- (low, or null when the scan failed), which never changes. Record the
-- human sign-off instead — reviewed_at set means the details were
-- verified against the photo, clearing the badge while preserving the
-- original scan confidence for the audit trail. Scans were never
-- editable, so owners also need an update policy.

alter table public.receipt_scans add column reviewed_at timestamptz;

create policy "owners can update receipt scans"
  on public.receipt_scans for update
  using (public.user_property_role(public.expense_property_id(expense_id)) = 'owner');
