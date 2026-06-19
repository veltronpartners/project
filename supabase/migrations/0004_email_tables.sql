-- STAFF MAILBOX CONNECTIONS
create table mailbox_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  email_address text not null,
  is_shared boolean default false,
  encrypted_password text not null,
  imap_host text default 'mail.veltronpartners.com',
  imap_port integer default 993,
  smtp_host text default 'mail.veltronpartners.com',
  smtp_port integer default 465,
  is_connected boolean default false,
  last_connection_check timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_mailbox_connections_updated_at before update on mailbox_connections
  for each row execute function set_updated_at();

-- SHARED MAILBOX ACCESS (which staff can use partnerships@ / contact@ etc.)
create table shared_mailbox_access (
  id uuid primary key default gen_random_uuid(),
  mailbox_email text not null,
  user_id uuid references users(id) on delete cascade,
  granted_by uuid references users(id),
  granted_at timestamptz default now()
);

-- EMAIL-PORTFOLIO LINKS (reference only — email content stays on the mail server)
create table email_portfolio_links (
  id uuid primary key default gen_random_uuid(),
  message_id text not null,
  mailbox_email text not null,
  folder_path text not null,
  cached_subject text,
  cached_participants text,
  cached_date timestamptz,
  portfolio_id uuid references portfolio_companies(id) on delete cascade,
  linked_by uuid references users(id),
  linked_at timestamptz default now(),
  notes text
);
