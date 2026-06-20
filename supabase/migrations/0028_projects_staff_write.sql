-- Bug fix: lib/permissions.ts grants the "staff" role "own" access to
-- the projects module (canEdit() returns true, so the create-project
-- form is reachable and submittable), but the RLS write policy never
-- accounted for that role at all -- only director, self-led
-- veltron_lead, and finance_officer could actually insert/update a row.
-- Any staff member creating a project (even with themselves as lead)
-- hit "new row violates row-level security policy".
drop policy "projects write" on internal_projects;
create policy "projects write" on internal_projects
  for all using (
    is_director()
    or (current_staff_role() in ('veltron_lead', 'staff') and lead_id = auth.uid())
    or current_staff_role() = 'finance_officer'
  )
  with check (
    is_director()
    or (current_staff_role() in ('veltron_lead', 'staff') and lead_id = auth.uid())
    or current_staff_role() = 'finance_officer'
  );
