-- Expirable, public, token-based form links for prospects who aren't
-- partner_contacts yet -- staff send these to anyone reaching out about
-- a partnership, the response feeds the decision on whether to bring
-- them on board (Section 4 Engagement Intake). Mirrors the e-signature
-- public-token pattern (lib/signatures/sign-flow.ts): all access goes
-- through server actions on the admin client, never direct anon RLS,
-- so there's no need for permissive anon policies on these tables.

create table form_link_tokens (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references forms(id) on delete cascade,
  token text unique not null,
  recipient_name text,
  recipient_email text,
  created_by uuid references users(id),
  expires_at timestamptz not null,
  status text check (status in ('active', 'submitted', 'expired', 'revoked')) default 'active',
  submission_id uuid,
  created_at timestamptz default now()
);

create table lead_form_submissions (
  id uuid primary key default gen_random_uuid(),
  token_id uuid references form_link_tokens(id) on delete cascade,
  form_id uuid references forms(id),
  respondent_name text not null,
  respondent_email text not null,
  respondent_company text,
  answers jsonb not null default '{}',
  submitted_at timestamptz default now(),
  review_decision text check (review_decision in ('pending', 'move_to_intake', 'declined')) default 'pending',
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  linked_engagement_id uuid references engagements(id),
  created_at timestamptz default now()
);

alter table form_link_tokens add constraint form_link_tokens_submission_fk
  foreign key (submission_id) references lead_form_submissions(id);

alter table form_link_tokens enable row level security;
alter table lead_form_submissions enable row level security;

create policy "form link tokens staff read" on form_link_tokens
  for select using (is_staff_member());
create policy "form link tokens staff write" on form_link_tokens
  for all using (is_staff_member());

create policy "lead submissions staff read" on lead_form_submissions
  for select using (is_staff_member());
create policy "lead submissions staff update" on lead_form_submissions
  for update using (is_staff_member());
