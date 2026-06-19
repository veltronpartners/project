-- Document Vault storage bucket (Spec Module 11). Private bucket — access
-- is gated at the application layer via signed URLs, with the `documents`
-- table's access_level RLS as the real boundary on which rows are visible.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "staff can upload documents" on storage.objects
  for insert with check (bucket_id = 'documents' and is_staff_member());

create policy "staff can read documents" on storage.objects
  for select using (bucket_id = 'documents' and is_staff_member());

create policy "staff can delete documents" on storage.objects
  for delete using (bucket_id = 'documents' and is_staff_member());
