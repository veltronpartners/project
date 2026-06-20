-- Bug fix (systemic audit, same class as 0028): two more RLS write
-- policies didn't match what lib/permissions.ts's canEdit() actually
-- lets a role reach in the UI.

-- portfolio_companies: "portfolio update" already includes
-- partnerships_officer (matrix: edit), but "portfolio create" (INSERT)
-- never did -- they could edit an existing company but never add one,
-- even though /portfolio/new is reachable for them.
drop policy "portfolio create" on portfolio_companies;
create policy "portfolio create" on portfolio_companies
  for insert with check (
    is_director()
    or current_staff_role() = 'partnerships_officer'
    or current_staff_role() = 'veltron_lead'
  );

-- forms: matrix says intake's partnerships_officer = "full" (matching
-- engagements' own RLS policy already), but "forms write" only ever
-- allowed director + veltron_lead -- partnerships_officer could reach
-- /forms/new and submit, then hit "violates row-level security policy".
drop policy "forms write" on forms;
create policy "forms write" on forms
  for all using (
    is_director()
    or current_staff_role() = 'partnerships_officer'
    or (current_staff_role() = 'veltron_lead' and created_by = auth.uid())
  )
  with check (
    is_director()
    or current_staff_role() = 'partnerships_officer'
    or (current_staff_role() = 'veltron_lead' and created_by = auth.uid())
  );
