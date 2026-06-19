-- USERS & AUTH
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  role user_role not null,
  avatar_url text,
  phone text,
  linkedin_url text,
  department text,
  is_active boolean default true,
  google_refresh_token text,
  slack_user_id text,
  two_factor_secret text,
  two_factor_enabled boolean default false,
  two_factor_backup_codes text[],
  two_factor_setup_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_users_updated_at before update on users
  for each row execute function set_updated_at();

-- PORTFOLIO COMPANIES
create table portfolio_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  trading_name text,
  industry text,
  website text,
  founded_date date,
  hq_location text,
  team_size integer,
  stage text check (stage in ('idea', 'pre-revenue', 'revenue-generating', 'scaling', 'growth')),
  status text check (status in ('active', 'in_discussion', 'exited', 'declined')) default 'active',
  engagement_type text check (engagement_type in ('partnerships', 'fundraising', 'advisory', 'execution', 'combination')),
  veltron_lead_id uuid references users(id),
  partnership boolean default false,
  fundraising boolean default false,
  equity_fee_terms text,
  reporting_cadence text check (reporting_cadence in ('weekly', 'biweekly', 'monthly')),
  exit_criteria text,
  agreement_signed boolean default false,
  agreement_date date,
  health_indicator health_indicator default 'green',
  onboarded_at date,
  last_checkin date,
  next_checkin date,
  top_priority text,
  key_risk text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_portfolio_companies_updated_at before update on portfolio_companies
  for each row execute function set_updated_at();

-- PORTFOLIO KPIs
create table portfolio_kpis (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolio_companies(id) on delete cascade,
  kpi_name text not null,
  target text,
  current_value text,
  unit text,
  last_updated date,
  notes text
);

-- PORTFOLIO ACTION ITEMS
create table portfolio_actions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolio_companies(id) on delete cascade,
  title text not null,
  owner_id uuid references users(id),
  due_date date,
  status text check (status in ('pending', 'in_progress', 'complete', 'overdue')) default 'pending',
  priority integer check (priority in (1, 2, 3)),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_portfolio_actions_updated_at before update on portfolio_actions
  for each row execute function set_updated_at();

-- ENGAGEMENT INTAKE
create table engagements (
  id uuid primary key default gen_random_uuid(),
  ref_number text unique,
  company_name text not null,
  industry text,
  engagement_type text,
  source text check (source in ('inbound', 'outbound', 'referral')),
  referred_by text,
  officer_id uuid references users(id),
  lead_id uuid references users(id),
  current_stage integer not null default 1 check (current_stage between 1 and 6),
  overall_status text check (overall_status in ('pending', 'in_progress', 'approved', 'declined', 'under_review')) default 'pending',
  priority_level text check (priority_level in ('high', 'medium', 'low')) default 'medium',
  target_decision_date date,
  checklist_version text default 'v1.0',
  date_opened date default current_date,
  final_decision text check (final_decision in ('Approved', 'Declined', 'Pending Further Review')),
  decline_reason text,
  linked_portfolio_id uuid references portfolio_companies(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_engagements_updated_at before update on engagements
  for each row execute function set_updated_at();

create or replace function generate_engagement_ref()
returns trigger
language plpgsql
as $$
declare
  yr text := to_char(current_date, 'YY');
  next_num int;
begin
  if new.ref_number is null then
    select count(*) + 1 into next_num
    from engagements
    where ref_number like 'VPE-' || yr || '-%';
    new.ref_number := 'VPE-' || yr || '-' || lpad(next_num::text, 3, '0');
  end if;
  return new;
end;
$$;
create trigger trg_generate_engagement_ref before insert on engagements
  for each row execute function generate_engagement_ref();

-- ENGAGEMENT CHECKLIST ITEMS
create table engagement_checklist_items (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid references engagements(id) on delete cascade,
  stage integer not null check (stage between 1 and 6),
  item_text text not null,
  status text check (status in ('pending', 'complete', 'flagged', 'na')) default 'pending',
  officer_id uuid references users(id),
  date_done date,
  notes text
);

-- ENGAGEMENT STAGE SIGN-OFFS
create table engagement_signoffs (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid references engagements(id) on delete cascade,
  stage integer not null check (stage between 1 and 6),
  officer_name text,
  officer_id uuid references users(id),
  signed_at timestamptz default now(),
  remarks text
);

-- ENGAGEMENT OFFICER NOTES (per stage)
create table engagement_notes (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid references engagements(id) on delete cascade,
  stage integer not null check (stage between 1 and 6),
  author_id uuid references users(id) not null,
  note_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_engagement_notes_updated_at before update on engagement_notes
  for each row execute function set_updated_at();

-- DECISION LOG
create table decisions (
  id uuid primary key default gen_random_uuid(),
  log_id text unique,
  date date not null default current_date,
  portfolio_id uuid references portfolio_companies(id),
  project_id uuid,
  category text check (category in ('partnership', 'fundraising', 'scope', 'hiring', 'legal', 'financial', 'strategy', 'operations', 'other')) not null,
  decision_summary text not null,
  rationale text not null,
  options_considered text not null,
  decision_maker_id uuid references users(id),
  stakeholders_informed text,
  status text check (status in ('approved', 'in_progress', 'under_review', 'declined', 'superseded')) default 'in_progress',
  due_date date,
  owner_id uuid references users(id),
  outcome_notes text,
  review_date date,
  superseded_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_decisions_updated_at before update on decisions
  for each row execute function set_updated_at();

create or replace function generate_decision_log_id()
returns trigger
language plpgsql
as $$
declare
  next_num int;
begin
  if new.log_id is null then
    select count(*) + 1 into next_num from decisions;
    new.log_id := 'VDL-' || lpad(next_num::text, 3, '0');
  end if;
  return new;
end;
$$;
create trigger trg_generate_decision_log_id before insert on decisions
  for each row execute function generate_decision_log_id();

-- INTERNAL PROJECTS
create table internal_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text check (type in ('product_build', 'design', 'systems', 'other')),
  scale text check (scale in ('small', 'medium', 'large')),
  status text check (status in ('planning', 'in_progress', 'completed', 'on_hold', 'cancelled')) default 'planning',
  lead_id uuid references users(id),
  team_members uuid[],
  start_date date,
  target_end_date date,
  percent_complete integer default 0 check (percent_complete between 0 and 100),
  budget_estimated numeric,
  budget_used numeric default 0,
  currency text default 'USD',
  budget_approved boolean default false,
  in_scope text,
  out_of_scope text,
  success_criteria text,
  top_priority text,
  key_risk text,
  health_indicator health_indicator default 'green',
  linked_portfolio_id uuid references portfolio_companies(id),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_internal_projects_updated_at before update on internal_projects
  for each row execute function set_updated_at();

alter table decisions add constraint decisions_project_id_fkey
  foreign key (project_id) references internal_projects(id);

-- PROJECT MILESTONES
create table project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references internal_projects(id) on delete cascade,
  title text not null,
  target_date date,
  status text check (status in ('pending', 'in_progress', 'complete', 'delayed')) default 'pending',
  notes text
);

-- PROJECT TASKS
create table project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references internal_projects(id) on delete cascade,
  title text not null,
  assignee_id uuid references users(id),
  priority text check (priority in ('high', 'medium', 'low')) default 'medium',
  due_date date,
  status text check (status in ('pending', 'in_progress', 'complete', 'overdue')) default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_project_tasks_updated_at before update on project_tasks
  for each row execute function set_updated_at();

-- PROJECT BUDGET LINE ITEMS
create table project_budget_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references internal_projects(id) on delete cascade,
  item_name text not null,
  category text,
  vendor text,
  estimated numeric,
  actual numeric,
  currency text default 'USD',
  date date,
  notes text
);

-- PROJECT RISKS
create table project_risks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references internal_projects(id) on delete cascade,
  description text not null,
  type text check (type in ('risk', 'decision')) default 'risk',
  likelihood text check (likelihood in ('high', 'medium', 'low')),
  impact text check (impact in ('high', 'medium', 'low')),
  mitigation text,
  owner_id uuid references users(id),
  status text check (status in ('open', 'mitigated', 'resolved', 'accepted')) default 'open',
  linked_decision_id uuid references decisions(id)
);

-- CONTACTS & PARTNERS DIRECTORY
create table contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  organisation text,
  role_title text,
  contact_type text check (contact_type in ('portfolio_contact', 'investor', 'advisor', 'legal', 'partner', 'vendor', 'other')),
  email text,
  phone text,
  linkedin_url text,
  website text,
  portfolio_id uuid references portfolio_companies(id),
  status text check (status in ('active', 'inactive', 'archived')) default 'active',
  last_contact date,
  notes text,
  added_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_contacts_updated_at before update on contacts
  for each row execute function set_updated_at();

-- MEETINGS
create table meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_type text check (meeting_type in ('portfolio_checkin', 'internal', 'external', 'board')),
  date timestamptz not null,
  duration_minutes integer,
  location text,
  google_meet_link text,
  google_calendar_event_id text,
  portfolio_id uuid references portfolio_companies(id),
  project_id uuid references internal_projects(id),
  organiser_id uuid references users(id),
  attendees uuid[],
  external_attendees text,
  agenda text,
  key_decisions text,
  action_items text,
  next_meeting date,
  notes text,
  status text check (status in ('scheduled', 'completed', 'cancelled')) default 'scheduled',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_meetings_updated_at before update on meetings
  for each row execute function set_updated_at();

-- HR — STAFF DIRECTORY (extends users)
create table staff_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) unique,
  employment_type text check (employment_type in ('full_time', 'part_time', 'contractor', 'advisor')),
  start_date date,
  end_date date,
  contract_status text check (contract_status in ('active', 'pending_renewal', 'expired')) default 'active',
  contract_file_url text,
  reporting_to uuid references users(id),
  remuneration text,
  performance_notes text,
  emergency_contact_name text,
  emergency_contact_phone text,
  timezone text,
  location_country text,
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_staff_profiles_updated_at before update on staff_profiles
  for each row execute function set_updated_at();

-- HR — ONBOARDING TRACKER
create table onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  task_name text not null,
  category text check (category in ('admin', 'system_access', 'training', 'introductions')),
  status text check (status in ('pending', 'in_progress', 'complete')) default 'pending',
  due_date date,
  completed_at timestamptz,
  assigned_to uuid references users(id),
  notes text
);

-- HR — LEAVE MANAGEMENT
create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  leave_type text check (leave_type in ('annual', 'sick', 'personal', 'unpaid', 'other')),
  start_date date not null,
  end_date date not null,
  days_count numeric,
  reason text,
  status text check (status in ('pending', 'approved', 'declined')) default 'pending',
  approved_by uuid references users(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- FINANCE — COMPANY BUDGET
create table finance_budgets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  period_start date,
  period_end date,
  total_budget numeric,
  currency text default 'USD',
  approved boolean default false,
  approved_by uuid references users(id),
  notes text,
  created_at timestamptz default now()
);

-- FINANCE — EXPENSE TRACKER
create table expenses (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid references finance_budgets(id),
  project_id uuid references internal_projects(id),
  portfolio_id uuid references portfolio_companies(id),
  submitted_by uuid references users(id),
  category text check (category in ('operations', 'travel', 'legal', 'marketing', 'payroll', 'other')),
  description text not null,
  amount numeric not null,
  currency text default 'USD',
  date date default current_date,
  receipt_url text,
  status text check (status in ('pending', 'approved', 'declined', 'reimbursed')) default 'pending',
  approved_by uuid references users(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- COMPLIANCE — CONFLICT OF INTEREST REGISTER
create table conflict_register (
  id uuid primary key default gen_random_uuid(),
  reported_by uuid references users(id),
  conflict_type text check (conflict_type in ('financial', 'personal', 'professional', 'other')),
  description text not null,
  parties_involved text,
  related_portfolio_id uuid references portfolio_companies(id),
  related_engagement_id uuid references engagements(id),
  status text check (status in ('open', 'under_review', 'resolved', 'noted')) default 'open',
  resolution text,
  resolved_at timestamptz,
  reviewed_by uuid references users(id),
  created_at timestamptz default now()
);

-- COMPLIANCE — CONTRACT TRACKER
create table contracts (
  id uuid primary key default gen_random_uuid(),
  contract_type text check (contract_type in ('engagement_letter', 'mou', 'nda', 'service_agreement', 'employment', 'vendor', 'other')),
  title text not null,
  counterparty text,
  portfolio_id uuid references portfolio_companies(id),
  signed_date date,
  effective_date date,
  expiry_date date,
  renewal_date date,
  status text check (status in ('draft', 'pending_signature', 'active', 'expired', 'terminated')) default 'draft',
  signed_by_veltron uuid references users(id),
  file_url text,
  gdrive_file_id text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_contracts_updated_at before update on contracts
  for each row execute function set_updated_at();

-- DOCUMENT VAULT
create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text check (category in ('engagement', 'due_diligence', 'legal', 'financial', 'hr', 'templates', 'policies', 'reports')),
  description text,
  file_url text,
  gdrive_file_id text,
  file_type text,
  file_size_kb integer,
  portfolio_id uuid references portfolio_companies(id),
  project_id uuid references internal_projects(id),
  engagement_id uuid references engagements(id),
  uploaded_by uuid references users(id),
  version text default '1.0',
  access_level text check (access_level in ('internal', 'director_only', 'hr_only', 'compliance_only')) default 'internal',
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_documents_updated_at before update on documents
  for each row execute function set_updated_at();

-- ANNOUNCEMENTS
create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  priority text check (priority in ('urgent', 'normal', 'info')) default 'normal',
  posted_by uuid references users(id),
  target_roles text[],
  slack_posted boolean default false,
  pinned boolean default false,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- KNOWLEDGE BASE ARTICLES
create table kb_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text check (category in ('policy', 'sop', 'guide', 'template', 'faq')),
  body text,
  notion_page_id text,
  author_id uuid references users(id),
  last_edited_by uuid references users(id),
  tags text[],
  is_published boolean default true,
  view_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_kb_articles_updated_at before update on kb_articles
  for each row execute function set_updated_at();

-- AUDIT LOG
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id),
  action text not null,
  resource_type text not null,
  resource_id uuid,
  resource_name text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- NOTIFICATIONS
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text check (type in ('task_due', 'stage_signoff', 'decision_logged', 'announcement', 'leave_request', 'flagged_item')),
  title text not null,
  message text,
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);
