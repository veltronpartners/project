-- SIGNATURE REQUESTS
create table signature_requests (
  id uuid primary key default gen_random_uuid(),
  document_title text not null,
  source_document_url text not null,
  final_signed_document_url text,
  signing_method text not null check (signing_method in ('in_portal', 'uploaded_external')),
  signing_order text default 'sequential' check (signing_order in ('sequential', 'parallel')),
  status text check (status in ('draft', 'sent', 'partially_signed', 'fully_signed', 'locked')) default 'draft',
  portfolio_id uuid references portfolio_companies(id),
  engagement_id uuid references engagements(id),
  contract_id uuid references contracts(id),
  created_by uuid references users(id),
  externally_signed_date date,
  externally_signed_by text,
  external_signing_tool text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_signature_requests_updated_at before update on signature_requests
  for each row execute function set_updated_at();

-- SIGNERS (for in-portal signing — one row per required signer)
create table signature_signers (
  id uuid primary key default gen_random_uuid(),
  signature_request_id uuid references signature_requests(id) on delete cascade,
  signer_name text not null,
  signer_email text not null,
  is_internal boolean default false,
  internal_user_id uuid references users(id),
  signing_sequence integer,
  status text check (status in ('pending', 'signed', 'declined')) default 'pending',
  signed_at timestamptz,
  signature_ip_address text,
  secure_link_token text,
  created_at timestamptz default now()
);
