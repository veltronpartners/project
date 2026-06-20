-- Bug fix: the "documents" storage bucket only had policies gated by
-- is_staff_member(), so app/(partner)/partner/actions.ts's
-- uploadPartnerDocument() was silently failing RLS for every partner
-- upload attempt -- the file picker worked, the form "submitted", but
-- storage.objects insert was denied. Paths are now
-- partner-uploads/<partner_contact_id>/<file>, so a partner can write
-- under their own folder and read back only their own uploads; staff
-- retain unrestricted read via the existing "staff can read documents"
-- policy.
create policy "partners can upload their own documents" on storage.objects
  for insert
  with check (
    bucket_id = 'documents'
    and is_partner_contact()
    and (storage.foldername(name))[1] = 'partner-uploads'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "partners can read their own documents" on storage.objects
  for select
  using (
    bucket_id = 'documents'
    and is_partner_contact()
    and (storage.foldername(name))[1] = 'partner-uploads'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
