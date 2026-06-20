-- Automated daily backups (spec Section 19, never implemented). The cron
-- route writes via the service-role client, so it doesn't need an INSERT
-- policy here -- this just lets a Director list/download snapshots from
-- the UI without needing the service-role key.
insert into storage.buckets (id, name, public)
values ('backups', 'backups', false)
on conflict (id) do nothing;

create policy "directors can read backups" on storage.objects
  for select using (bucket_id = 'backups' and is_director());
