-- Every table gets RLS enabled. Policies below implement the role/access
-- matrix in Spec Section 3.2. This is the real security boundary — the
-- application's RoleGate/usePermission checks (lib/permissions.ts) are a
-- UI layer on top, not a substitute (Spec Section 17).

alter table users enable row level security;
alter table portfolio_companies enable row level security;
alter table portfolio_kpis enable row level security;
alter table portfolio_actions enable row level security;
alter table engagements enable row level security;
alter table engagement_checklist_items enable row level security;
alter table engagement_signoffs enable row level security;
alter table engagement_notes enable row level security;
alter table decisions enable row level security;
alter table internal_projects enable row level security;
alter table project_milestones enable row level security;
alter table project_tasks enable row level security;
alter table project_budget_items enable row level security;
alter table project_risks enable row level security;
alter table contacts enable row level security;
alter table meetings enable row level security;
alter table staff_profiles enable row level security;
alter table onboarding_tasks enable row level security;
alter table leave_requests enable row level security;
alter table finance_budgets enable row level security;
alter table expenses enable row level security;
alter table conflict_register enable row level security;
alter table contracts enable row level security;
alter table documents enable row level security;
alter table announcements enable row level security;
alter table kb_articles enable row level security;
alter table audit_log enable row level security;
alter table notifications enable row level security;
alter table partner_contacts enable row level security;
alter table forms enable row level security;
alter table form_assignments enable row level security;
alter table form_submissions enable row level security;
alter table partner_documents enable row level security;
alter table partner_messages enable row level security;
alter table partner_actions enable row level security;
alter table partner_report_schedule enable row level security;
alter table mailbox_connections enable row level security;
alter table shared_mailbox_access enable row level security;
alter table email_portfolio_links enable row level security;
alter table approval_policies enable row level security;
alter table acting_ceo_periods enable row level security;
alter table approval_requests enable row level security;
alter table signature_requests enable row level security;
alter table signature_signers enable row level security;

-- users
create policy "staff can read the company directory" on users
  for select using (is_staff_member());
create policy "users update own profile" on users
  for update using (auth.uid() = id);
create policy "director manages users" on users
  for all using (is_director());

-- portfolio_companies
create policy "portfolio read" on portfolio_companies
  for select using (
    is_director()
    or current_staff_role() in ('partnerships_officer', 'finance_officer', 'compliance_officer', 'secretary')
    or (current_staff_role() = 'veltron_lead' and veltron_lead_id = auth.uid())
    or (is_partner_contact() and id = current_partner_portfolio_id())
  );
create policy "portfolio create" on portfolio_companies
  for insert with check (is_director() or current_staff_role() = 'veltron_lead');
create policy "portfolio update" on portfolio_companies
  for update using (
    is_director()
    or current_staff_role() = 'partnerships_officer'
    or (current_staff_role() = 'veltron_lead' and veltron_lead_id = auth.uid())
  );

-- portfolio_kpis / portfolio_actions (mirror parent portfolio visibility)
create policy "portfolio kpis read" on portfolio_kpis
  for select using (
    exists (select 1 from portfolio_companies pc where pc.id = portfolio_kpis.portfolio_id)
    and (
      is_director()
      or current_staff_role() in ('partnerships_officer', 'finance_officer', 'compliance_officer', 'secretary')
      or exists (select 1 from portfolio_companies pc where pc.id = portfolio_kpis.portfolio_id and pc.veltron_lead_id = auth.uid())
      or (is_partner_contact() and portfolio_id = current_partner_portfolio_id())
    )
  );
create policy "portfolio kpis write" on portfolio_kpis
  for all using (
    is_director()
    or current_staff_role() = 'partnerships_officer'
    or exists (select 1 from portfolio_companies pc where pc.id = portfolio_kpis.portfolio_id and pc.veltron_lead_id = auth.uid())
  );

create policy "portfolio actions read" on portfolio_actions
  for select using (
    is_director()
    or current_staff_role() in ('partnerships_officer', 'finance_officer', 'compliance_officer', 'secretary')
    or exists (select 1 from portfolio_companies pc where pc.id = portfolio_actions.portfolio_id and pc.veltron_lead_id = auth.uid())
    or owner_id = auth.uid()
  );
create policy "portfolio actions write" on portfolio_actions
  for all using (
    is_director()
    or current_staff_role() = 'partnerships_officer'
    or exists (select 1 from portfolio_companies pc where pc.id = portfolio_actions.portfolio_id and pc.veltron_lead_id = auth.uid())
    or owner_id = auth.uid()
  );

-- engagements
create policy "engagements read" on engagements
  for select using (
    is_director()
    or current_staff_role() in ('partnerships_officer', 'compliance_officer', 'secretary')
    or (current_staff_role() = 'veltron_lead' and lead_id = auth.uid())
    or officer_id = auth.uid()
  );
create policy "engagements write" on engagements
  for all using (
    is_director()
    or current_staff_role() = 'partnerships_officer'
    or (current_staff_role() = 'veltron_lead' and lead_id = auth.uid())
  );

create policy "engagement checklist items read" on engagement_checklist_items
  for select using (
    exists (
      select 1 from engagements e where e.id = engagement_checklist_items.engagement_id
      and (
        is_director()
        or current_staff_role() in ('partnerships_officer', 'compliance_officer', 'secretary')
        or (current_staff_role() = 'veltron_lead' and e.lead_id = auth.uid())
        or e.officer_id = auth.uid()
      )
    )
  );
create policy "engagement checklist items write" on engagement_checklist_items
  for all using (
    exists (
      select 1 from engagements e where e.id = engagement_checklist_items.engagement_id
      and (
        is_director()
        or current_staff_role() = 'partnerships_officer'
        or (current_staff_role() = 'veltron_lead' and e.lead_id = auth.uid())
      )
    )
  );

create policy "engagement signoffs read" on engagement_signoffs
  for select using (
    exists (
      select 1 from engagements e where e.id = engagement_signoffs.engagement_id
      and (
        is_director()
        or current_staff_role() in ('partnerships_officer', 'compliance_officer', 'secretary')
        or (current_staff_role() = 'veltron_lead' and e.lead_id = auth.uid())
      )
    )
  );
create policy "engagement signoffs write" on engagement_signoffs
  for insert with check (
    exists (
      select 1 from engagements e where e.id = engagement_signoffs.engagement_id
      and (
        is_director()
        or current_staff_role() = 'partnerships_officer'
        or (current_staff_role() = 'veltron_lead' and e.lead_id = auth.uid())
      )
    )
  );

create policy "engagement notes read" on engagement_notes
  for select using (
    exists (
      select 1 from engagements e where e.id = engagement_notes.engagement_id
      and (
        is_director()
        or current_staff_role() in ('partnerships_officer', 'compliance_officer', 'secretary')
        or (current_staff_role() = 'veltron_lead' and e.lead_id = auth.uid())
      )
    )
  );
create policy "engagement notes write" on engagement_notes
  for all using (author_id = auth.uid() or is_director());

-- decisions
create policy "decisions read" on decisions
  for select using (
    is_director()
    or current_staff_role() in ('partnerships_officer', 'finance_officer', 'compliance_officer')
    or (current_staff_role() = 'veltron_lead' and exists (
      select 1 from portfolio_companies pc where pc.id = decisions.portfolio_id and pc.veltron_lead_id = auth.uid()
    ))
    or decision_maker_id = auth.uid()
    or owner_id = auth.uid()
  );
create policy "decisions write" on decisions
  for all using (
    is_director()
    or current_staff_role() = 'partnerships_officer'
    or (current_staff_role() = 'veltron_lead' and (
      portfolio_id is null or exists (
        select 1 from portfolio_companies pc where pc.id = decisions.portfolio_id and pc.veltron_lead_id = auth.uid()
      )
    ))
    or decision_maker_id = auth.uid()
    or owner_id = auth.uid()
  );

-- internal_projects
create policy "projects read" on internal_projects
  for select using (
    is_director()
    or current_staff_role() in ('partnerships_officer', 'finance_officer', 'compliance_officer', 'secretary')
    or (current_staff_role() = 'veltron_lead' and lead_id = auth.uid())
    or auth.uid() = any(team_members)
  );
create policy "projects write" on internal_projects
  for all using (
    is_director()
    or (current_staff_role() = 'veltron_lead' and lead_id = auth.uid())
    or current_staff_role() = 'finance_officer'
  );

create policy "project milestones rw" on project_milestones
  for all using (
    exists (select 1 from internal_projects p where p.id = project_milestones.project_id and (
      is_director() or (p.lead_id = auth.uid()) or auth.uid() = any(p.team_members)
    ))
  );
create policy "project tasks read" on project_tasks
  for select using (
    exists (select 1 from internal_projects p where p.id = project_tasks.project_id and (
      is_director() or current_staff_role() in ('partnerships_officer', 'finance_officer', 'compliance_officer', 'secretary')
      or p.lead_id = auth.uid() or auth.uid() = any(p.team_members)
    ))
    or assignee_id = auth.uid()
  );
create policy "project tasks write" on project_tasks
  for all using (
    exists (select 1 from internal_projects p where p.id = project_tasks.project_id and (is_director() or p.lead_id = auth.uid()))
    or assignee_id = auth.uid()
  );
create policy "project budget items rw" on project_budget_items
  for all using (
    is_director()
    or current_staff_role() = 'finance_officer'
    or exists (select 1 from internal_projects p where p.id = project_budget_items.project_id and p.lead_id = auth.uid())
  );
create policy "project risks rw" on project_risks
  for all using (
    exists (select 1 from internal_projects p where p.id = project_risks.project_id and (
      is_director() or p.lead_id = auth.uid() or auth.uid() = any(p.team_members)
    ))
    or owner_id = auth.uid()
  );

-- contacts
create policy "contacts read" on contacts for select using (is_staff_member());
create policy "contacts write" on contacts
  for all using (is_director() or current_staff_role() in ('veltron_lead', 'partnerships_officer'));

-- meetings
create policy "meetings read" on meetings
  for select using (
    is_director()
    or current_staff_role() in ('veltron_lead', 'partnerships_officer', 'secretary', 'finance_officer', 'compliance_officer')
    or auth.uid() = any(attendees)
    or (is_partner_contact() and portfolio_id = current_partner_portfolio_id())
  );
create policy "meetings write" on meetings
  for all using (
    is_director()
    or current_staff_role() in ('veltron_lead', 'partnerships_officer', 'secretary')
    or organiser_id = auth.uid()
  );

-- staff_profiles
create policy "staff profiles read" on staff_profiles
  for select using (
    is_director() or current_staff_role() in ('hr_officer', 'veltron_lead') or user_id = auth.uid()
  );
create policy "staff profiles write" on staff_profiles
  for all using (is_director() or current_staff_role() = 'hr_officer');

-- onboarding_tasks
create policy "onboarding tasks read" on onboarding_tasks
  for select using (
    is_director() or current_staff_role() = 'hr_officer' or user_id = auth.uid() or assigned_to = auth.uid()
  );
create policy "onboarding tasks write" on onboarding_tasks
  for all using (
    is_director() or current_staff_role() = 'hr_officer' or assigned_to = auth.uid()
  );

-- leave_requests
create policy "leave requests read" on leave_requests
  for select using (is_director() or current_staff_role() = 'hr_officer' or user_id = auth.uid());
create policy "leave requests insert" on leave_requests
  for insert with check (user_id = auth.uid() or is_director() or current_staff_role() = 'hr_officer');
create policy "leave requests update" on leave_requests
  for update using (is_director() or current_staff_role() = 'hr_officer');

-- finance_budgets
create policy "finance budgets read" on finance_budgets
  for select using (is_director() or current_staff_role() in ('finance_officer', 'compliance_officer', 'veltron_lead'));
create policy "finance budgets write" on finance_budgets
  for all using (is_director() or current_staff_role() = 'finance_officer');

-- expenses
create policy "expenses read" on expenses
  for select using (
    is_director() or current_staff_role() in ('finance_officer', 'compliance_officer') or submitted_by = auth.uid()
  );
create policy "expenses insert" on expenses
  for insert with check (submitted_by = auth.uid() or is_director());
create policy "expenses update" on expenses
  for update using (
    is_director() or current_staff_role() = 'finance_officer' or (submitted_by = auth.uid() and status = 'pending')
  );

-- conflict_register
create policy "conflicts read" on conflict_register
  for select using (is_director() or current_staff_role() = 'compliance_officer' or reported_by = auth.uid());
create policy "conflicts insert" on conflict_register
  for insert with check (reported_by = auth.uid());
create policy "conflicts update" on conflict_register
  for update using (is_director() or current_staff_role() = 'compliance_officer');

-- contracts
create policy "contracts read" on contracts
  for select using (
    is_director()
    or current_staff_role() in ('compliance_officer', 'partnerships_officer')
    or (current_staff_role() = 'veltron_lead' and exists (
      select 1 from portfolio_companies pc where pc.id = contracts.portfolio_id and pc.veltron_lead_id = auth.uid()
    ))
  );
create policy "contracts write" on contracts
  for all using (is_director() or current_staff_role() = 'compliance_officer');

-- documents
create policy "documents read" on documents
  for select using (
    is_director()
    or (access_level = 'internal' and is_staff_member())
    or (access_level = 'hr_only' and current_staff_role() = 'hr_officer')
    or (access_level = 'compliance_only' and current_staff_role() = 'compliance_officer')
    or uploaded_by = auth.uid()
    or (current_staff_role() = 'veltron_lead' and exists (
      select 1 from portfolio_companies pc where pc.id = documents.portfolio_id and pc.veltron_lead_id = auth.uid()
    ))
  );
create policy "documents insert" on documents
  for insert with check (uploaded_by = auth.uid());
create policy "documents update" on documents
  for update using (is_director() or uploaded_by = auth.uid());

-- announcements
create policy "announcements read" on announcements for select using (is_staff_member());
create policy "announcements write" on announcements for all using (is_director());

-- kb_articles
create policy "kb read" on kb_articles for select using (is_staff_member());
create policy "kb write" on kb_articles
  for all using (is_director() or current_staff_role() = 'veltron_lead');

-- audit_log (immutable — insert your own entries, no update/delete policy exists for anyone)
create policy "audit log insert own" on audit_log
  for insert with check (actor_id = auth.uid());
create policy "audit log read" on audit_log
  for select using (is_director() or current_staff_role() = 'compliance_officer');

-- notifications
create policy "notifications read own" on notifications for select using (user_id = auth.uid());
create policy "notifications update own" on notifications for update using (user_id = auth.uid());
create policy "notifications insert" on notifications for insert with check (is_staff_member());

-- partner_contacts
create policy "partner contacts read" on partner_contacts
  for select using (is_staff_member() or id = auth.uid());
create policy "partner contacts write" on partner_contacts
  for all using (is_director() or current_staff_role() in ('veltron_lead', 'partnerships_officer'));

-- forms
create policy "forms read" on forms
  for select using (
    is_staff_member()
    or exists (select 1 from form_assignments fa where fa.form_id = forms.id and fa.partner_contact_id = auth.uid())
  );
create policy "forms write" on forms
  for all using (is_director() or current_staff_role() = 'veltron_lead');

-- form_assignments
create policy "form assignments read" on form_assignments
  for select using (is_staff_member() or partner_contact_id = auth.uid());
create policy "form assignments staff write" on form_assignments
  for all using (is_director() or current_staff_role() in ('veltron_lead', 'partnerships_officer'));
create policy "form assignments partner update" on form_assignments
  for update using (partner_contact_id = auth.uid());

-- form_submissions
create policy "form submissions read" on form_submissions
  for select using (is_staff_member() or partner_contact_id = auth.uid());
create policy "form submissions partner write" on form_submissions
  for all using (partner_contact_id = auth.uid());
create policy "form submissions staff review" on form_submissions
  for update using (is_staff_member());

-- partner_documents
create policy "partner documents read" on partner_documents
  for select using (is_staff_member() or partner_contact_id = auth.uid());
create policy "partner documents insert" on partner_documents
  for insert with check (partner_contact_id = auth.uid() or is_staff_member());
create policy "partner documents review" on partner_documents
  for update using (is_staff_member());

-- partner_messages
create policy "partner messages read" on partner_messages
  for select using (
    is_staff_member()
    or sender_partner_id = auth.uid()
    or (is_partner_contact() and portfolio_id = current_partner_portfolio_id())
  );
create policy "partner messages insert" on partner_messages
  for insert with check (
    (sender_type = 'partner' and sender_partner_id = auth.uid() and portfolio_id = current_partner_portfolio_id())
    or (sender_type = 'veltron_staff' and sender_staff_id = auth.uid())
  );

-- partner_actions
create policy "partner actions read" on partner_actions
  for select using (is_staff_member() or partner_contact_id = auth.uid());
create policy "partner actions staff write" on partner_actions
  for all using (is_staff_member());
create policy "partner actions partner update" on partner_actions
  for update using (partner_contact_id = auth.uid());

-- partner_report_schedule
create policy "partner report schedule read" on partner_report_schedule
  for select using (is_staff_member() or partner_contact_id = auth.uid());
create policy "partner report schedule write" on partner_report_schedule
  for all using (is_staff_member());

-- mailbox_connections
create policy "mailbox connections rw" on mailbox_connections
  for all using (user_id = auth.uid() or is_director());

-- shared_mailbox_access
create policy "shared mailbox access read" on shared_mailbox_access
  for select using (user_id = auth.uid() or is_director());
create policy "shared mailbox access write" on shared_mailbox_access
  for all using (is_director());

-- email_portfolio_links
create policy "email links read" on email_portfolio_links
  for select using (
    is_director()
    or linked_by = auth.uid()
    or current_staff_role() = 'compliance_officer'
    or (current_staff_role() = 'veltron_lead' and exists (
      select 1 from portfolio_companies pc where pc.id = email_portfolio_links.portfolio_id and pc.veltron_lead_id = auth.uid()
    ))
  );
create policy "email links insert" on email_portfolio_links
  for insert with check (linked_by = auth.uid());

-- approval_policies
create policy "approval policies read" on approval_policies for select using (is_staff_member());
create policy "approval policies write" on approval_policies for all using (is_director());

-- acting_ceo_periods
create policy "acting ceo read" on acting_ceo_periods for select using (is_staff_member());
create policy "acting ceo write" on acting_ceo_periods for all using (is_director());

-- approval_requests
create policy "approval requests read" on approval_requests
  for select using (is_director() or requested_by = auth.uid() or routed_to_user_id = auth.uid());
create policy "approval requests insert" on approval_requests
  for insert with check (requested_by = auth.uid());
create policy "approval requests decide" on approval_requests
  for update using (routed_to_user_id = auth.uid() or is_director());

-- signature_requests
create policy "signature requests read" on signature_requests
  for select using (
    is_director()
    or created_by = auth.uid()
    or exists (select 1 from signature_signers s where s.signature_request_id = signature_requests.id and s.internal_user_id = auth.uid())
    or (current_staff_role() = 'veltron_lead' and exists (
      select 1 from portfolio_companies pc where pc.id = signature_requests.portfolio_id and pc.veltron_lead_id = auth.uid()
    ))
  );
create policy "signature requests write" on signature_requests
  for all using (is_director() or created_by = auth.uid());

-- signature_signers (external signers are looked up server-side by secure
-- token via the admin client in app/sign/[token] — never exposed through RLS)
create policy "signature signers read" on signature_signers
  for select using (
    internal_user_id = auth.uid()
    or exists (
      select 1 from signature_requests r where r.id = signature_signers.signature_request_id
      and (is_director() or r.created_by = auth.uid())
    )
  );
create policy "signature signers write" on signature_signers
  for all using (
    exists (
      select 1 from signature_requests r where r.id = signature_signers.signature_request_id
      and (is_director() or r.created_by = auth.uid())
    )
  );
