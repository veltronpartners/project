-- Settings -> Notifications: per-user delivery preferences. The spec
-- mentions "in-app / email / Slack DM" but our Slack integration is an
-- org-wide incoming webhook (no per-user DM capability), so only in-app
-- and email are real, controllable channels here.
create table notification_preferences (
  user_id uuid primary key references users(id) on delete cascade,
  categories jsonb not null default '{}',
  updated_at timestamptz default now()
);

create trigger trg_notification_preferences_updated_at before update on notification_preferences
  for each row execute function set_updated_at();

alter table notification_preferences enable row level security;

create policy "notification_preferences self read" on notification_preferences
  for select using (user_id = auth.uid());

create policy "notification_preferences self write" on notification_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Bug fix: partner-side actions (form submitted, document uploaded, meeting
-- requested, message sent) call createNotification() to alert the partner's
-- Veltron Lead, but the only existing insert policy on notifications
-- required is_staff_member() -- partners aren't staff, so those calls were
-- silently failing RLS. Scope the fix to "a partner can only notify the
-- lead assigned to their own portfolio."
create policy "partners notify their portfolio lead" on notifications
  for insert
  with check (
    is_partner_contact()
    and exists (
      select 1 from portfolio_companies pc
      where pc.veltron_lead_id = notifications.user_id
        and pc.id = current_partner_portfolio_id()
    )
  );
