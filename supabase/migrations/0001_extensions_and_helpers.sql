-- Extensions
create extension if not exists pgcrypto;

-- Shared role enum (Spec Section 3.1)
create type user_role as enum (
  'director',
  'veltron_lead',
  'partnerships_officer',
  'finance_officer',
  'hr_officer',
  'compliance_officer',
  'secretary',
  'staff'
);

create type health_indicator as enum ('green', 'yellow', 'red');

-- Generic updated_at trigger, attached per-table in later migrations.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- RLS helper functions (current_staff_role, is_director, etc.) live in
-- 0007_rls_helper_functions.sql — they query `users` / `partner_contacts`,
-- which don't exist until 0002/0003 run.
