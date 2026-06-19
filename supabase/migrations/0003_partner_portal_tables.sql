-- PARTNER CONTACTS (separate from Veltron staff users)
create table partner_contacts (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolio_companies(id) on delete cascade,
  full_name text not null,
  role_title text,
  email text unique not null,
  phone text,
  linkedin_url text,
  contact_type text check (contact_type in ('primary', 'secondary')) default 'primary',
  is_active boolean default true,
  last_login timestamptz,
  welcome_email_sent boolean default false,
  two_factor_secret text,
  two_factor_enabled boolean default false,
  two_factor_backup_codes text[],
  two_factor_setup_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_partner_contacts_updated_at before update on partner_contacts
  for each row execute function set_updated_at();

-- FORMS (designed by Veltron staff)
create table forms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  form_type text check (form_type in ('onboarding', 'periodic_report', 'document_request', 'annual_review', 'exit', 'custom')),
  status text check (status in ('draft', 'active', 'archived')) default 'draft',
  schema jsonb not null,
  created_by uuid references users(id),
  last_edited_by uuid references users(id),
  is_template boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_forms_updated_at before update on forms
  for each row execute function set_updated_at();

-- FORM ASSIGNMENTS (which form goes to which partner)
create table form_assignments (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references forms(id) on delete cascade,
  portfolio_id uuid references portfolio_companies(id),
  partner_contact_id uuid references partner_contacts(id) on delete cascade,
  assigned_by uuid references users(id),
  cover_note text,
  deadline date,
  status text check (status in ('not_started', 'in_progress', 'submitted', 'reopened', 'accepted', 'expired')) default 'not_started',
  notify_email boolean default true,
  notify_portal boolean default true,
  scheduled_send_at timestamptz,
  sent_at timestamptz,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references users(id),
  review_flag text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_form_assignments_updated_at before update on form_assignments
  for each row execute function set_updated_at();

-- FORM SUBMISSIONS (partner answers)
create table form_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references form_assignments(id) on delete cascade,
  partner_contact_id uuid references partner_contacts(id),
  answers jsonb not null,
  is_complete boolean default false,
  submitted_at timestamptz,
  last_saved_at timestamptz,
  ip_address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_form_submissions_updated_at before update on form_submissions
  for each row execute function set_updated_at();

-- PARTNER DOCUMENT UPLOADS
create table partner_documents (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolio_companies(id),
  partner_contact_id uuid references partner_contacts(id),
  title text not null,
  category text check (category in ('financial', 'legal', 'operational', 'other')),
  description text,
  file_url text not null,
  file_type text,
  file_size_kb integer,
  source text check (source in ('partner_upload', 'form_submission', 'veltron_request')) default 'partner_upload',
  document_request_id uuid,
  status text check (status in ('received', 'under_review', 'accepted', 'rejected')) default 'received',
  rejection_reason text,
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  linked_vault_document_id uuid references documents(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_partner_documents_updated_at before update on partner_documents
  for each row execute function set_updated_at();

-- PARTNER MESSAGES
create table partner_messages (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolio_companies(id),
  sender_type text not null check (sender_type in ('partner', 'veltron_staff')),
  sender_partner_id uuid references partner_contacts(id),
  sender_staff_id uuid references users(id),
  message_text text not null check (char_length(message_text) <= 2000),
  is_read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- PARTNER ACTION ITEMS (assigned by Veltron to partner)
create table partner_actions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolio_companies(id),
  partner_contact_id uuid references partner_contacts(id),
  assigned_by uuid references users(id),
  title text not null,
  description text,
  due_date date,
  status text check (status in ('pending', 'in_progress', 'done', 'overdue')) default 'pending',
  completion_note text check (char_length(completion_note) <= 300),
  evidence_file_url text,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_partner_actions_updated_at before update on partner_actions
  for each row execute function set_updated_at();

-- PARTNER REPORT SCHEDULE (cadence + due-date tracking for periodic reports)
create table partner_report_schedule (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolio_companies(id),
  partner_contact_id uuid references partner_contacts(id),
  report_form_id uuid references forms(id),
  cadence text not null check (cadence in ('weekly', 'biweekly', 'monthly')),
  cadence_day text,
  is_active boolean default true,
  last_report_due date,
  last_report_submitted date,
  next_report_due date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_partner_report_schedule_updated_at before update on partner_report_schedule
  for each row execute function set_updated_at();
