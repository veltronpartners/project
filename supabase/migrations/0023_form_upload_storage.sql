-- File-upload form fields (lib/forms/schema.ts "file_upload" type) need
-- their own storage path/policy pair, separate from partner-uploads/:
-- form-uploads/<partner_contact_id>/<assignment_id>/<file>.
create policy "partners can upload form field files" on storage.objects
  for insert
  with check (
    bucket_id = 'documents'
    and is_partner_contact()
    and (storage.foldername(name))[1] = 'form-uploads'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "partners can read their own form field files" on storage.objects
  for select
  using (
    bucket_id = 'documents'
    and is_partner_contact()
    and (storage.foldername(name))[1] = 'form-uploads'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
