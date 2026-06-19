-- RLS helper functions. SECURITY DEFINER so they bypass RLS on the tables
-- they query — without this, a policy on `users` that queries `users` to
-- find the caller's role would recurse infinitely.

create or replace function current_staff_role()
returns user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from users where id = auth.uid();
$$;

create or replace function is_director()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select role from users where id = auth.uid()) = 'director', false);
$$;

create or replace function is_staff_member()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(select 1 from users where id = auth.uid());
$$;

create or replace function current_partner_portfolio_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select portfolio_id from partner_contacts where id = auth.uid();
$$;

create or replace function is_partner_contact()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(select 1 from partner_contacts where id = auth.uid());
$$;
