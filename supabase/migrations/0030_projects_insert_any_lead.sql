-- Bug fix: 0028 scoped "staff"/"veltron_lead" writes to lead_id = auth.uid(),
-- which covers self-led projects but still rejects the very common case of
-- someone with create rights assigning a *different* person as the lead
-- (e.g. a staff member proposing a project and naming a veltron_lead to run
-- it). INSERT and UPDATE/DELETE need different rules: anyone with own+
-- access should be able to CREATE regardless of who they assign as lead,
-- but editing an existing project afterwards should stay scoped to its
-- actual lead (plus director/finance_officer), matching "own" semantics.
drop policy "projects write" on internal_projects;

create policy "projects insert" on internal_projects
  for insert with check (
    is_director()
    or current_staff_role() in ('veltron_lead', 'staff', 'finance_officer')
  );

create policy "projects update" on internal_projects
  for update using (
    is_director()
    or (current_staff_role() in ('veltron_lead', 'staff') and lead_id = auth.uid())
    or current_staff_role() = 'finance_officer'
  );

create policy "projects delete" on internal_projects
  for delete using (is_director());
