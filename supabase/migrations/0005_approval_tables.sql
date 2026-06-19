-- APPROVAL POLICY (CEO-configurable rules per category)
create table approval_policies (
  id uuid primary key default gen_random_uuid(),
  category text not null unique,
  tier integer not null check (tier in (1, 2, 3)),
  delegated_to_user_id uuid references users(id),
  delegated_to_role user_role,
  threshold_amount numeric,
  threshold_currency text default 'USD',
  updated_by uuid references users(id),
  updated_at timestamptz default now()
);
create trigger trg_approval_policies_updated_at before update on approval_policies
  for each row execute function set_updated_at();

-- ACTING CEO PERIODS
create table acting_ceo_periods (
  id uuid primary key default gen_random_uuid(),
  delegated_to_user_id uuid references users(id) not null,
  appointed_by uuid references users(id) not null,
  start_date timestamptz not null default now(),
  end_date timestamptz,
  ended_at timestamptz,
  ended_by uuid references users(id),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Only one Acting CEO period can be active at a time (Spec Section 12.3).
create unique index one_active_acting_ceo_period
  on acting_ceo_periods (is_active)
  where is_active;

-- APPROVAL REQUESTS (the actual queue)
create table approval_requests (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  resource_type text not null,
  resource_id uuid not null,
  summary text not null,
  requested_by uuid references users(id),
  routed_to_user_id uuid references users(id),
  status text check (status in ('pending', 'approved', 'declined', 'more_info_requested')) default 'pending',
  decision_by uuid references users(id),
  decision_at timestamptz,
  decline_reason text,
  urgency text check (urgency in ('low', 'normal', 'high')) default 'normal',
  created_at timestamptz default now()
);
