-- Bug fix (communication audit): there was no notification channel for
-- partners at all. Every partner action (message, document, form
-- submission, meeting request) properly notifies staff, but staff
-- actions back toward the partner (form assigned, message reply,
-- action assigned, document reviewed, submission reviewed) went
-- completely unseen unless the partner happened to check the portal.
create table partner_notifications (
  id uuid primary key default gen_random_uuid(),
  partner_contact_id uuid references partner_contacts(id) on delete cascade,
  type text check (type in ('form_assigned', 'form_reviewed', 'message', 'action_assigned', 'document_reviewed', 'report_due')),
  title text not null,
  message text,
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table partner_notifications enable row level security;

create policy "partner notifications read own" on partner_notifications
  for select using (partner_contact_id = auth.uid());
create policy "partner notifications update own" on partner_notifications
  for update using (partner_contact_id = auth.uid());
create policy "partner notifications insert by staff" on partner_notifications
  for insert with check (is_staff_member());
