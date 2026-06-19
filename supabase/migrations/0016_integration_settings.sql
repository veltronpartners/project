-- Settings -> Integrations (Spec Section 16) describes a UI for entering
-- Slack/Notion connection details, but Section 4's schema never defines
-- where that config lives. Sensitive secrets (bot token, webhook URL, API
-- key) are encrypted; channel/event preferences are plain since they
-- aren't credentials.
create table integration_settings (
  id uuid primary key default gen_random_uuid(),
  integration text not null unique check (integration in ('slack', 'notion')),
  encrypted_secret text,
  config jsonb,
  is_connected boolean default false,
  last_synced_at timestamptz,
  updated_by uuid references users(id),
  updated_at timestamptz default now()
);

alter table integration_settings enable row level security;

create policy "integration settings read" on integration_settings
  for select using (is_staff_member());
create policy "integration settings write" on integration_settings
  for all using (is_director());
