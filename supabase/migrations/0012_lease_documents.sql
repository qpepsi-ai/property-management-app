-- Signed lease documents: one file per lease, stored in a private
-- bucket at `{property_id}/{filename}` so the per-property folder
-- policies work the same way as receipts and maintenance photos.
-- Visibility matches the leases table: owner and co-owner only.

alter table public.leases add column document_path text;

insert into storage.buckets (id, name, public)
values ('lease-documents', 'lease-documents', false)
on conflict (id) do nothing;

create policy "owner or co-owner can view lease documents"
  on storage.objects for select
  using (
    bucket_id = 'lease-documents'
    and public.user_property_role((storage.foldername(name))[1]::uuid) in ('owner', 'co-owner')
  );

create policy "owners can upload lease documents"
  on storage.objects for insert
  with check (
    bucket_id = 'lease-documents'
    and public.user_property_role((storage.foldername(name))[1]::uuid) = 'owner'
  );

create policy "owners can delete lease documents"
  on storage.objects for delete
  using (
    bucket_id = 'lease-documents'
    and public.user_property_role((storage.foldername(name))[1]::uuid) = 'owner'
  );
