-- Seed data for first setup (Spec Section 9). Runs after all migrations.
-- author_id / posted_by are left null since no Veltron staff account exists
-- yet at first-run — the Director can reassign ownership once logged in.

-- ENGAGEMENT INTAKE CHECKLIST — MASTER TEMPLATE (all 6 stages)
insert into engagement_checklist_templates (stage, item_text, sort_order) values
  (1, 'Confirm inbound/outbound/referral source and log first contact', 1),
  (1, 'Company name, website, and one-line description on file', 2),
  (1, 'Initial fit screen against current portfolio focus areas', 3),
  (1, 'No obvious conflict of interest with existing portfolio', 4),
  (1, 'Assign Partnerships Officer and provisional Veltron Lead', 5),
  (2, 'Founder/cap table information collected', 1),
  (2, 'Pitch deck or company overview reviewed', 2),
  (2, 'Initial discovery call completed and notes filed', 3),
  (2, 'Financial snapshot (revenue, burn, runway) requested', 4),
  (2, 'Engagement type confirmed (partnerships / fundraising / advisory / execution / combination)', 5),
  (3, 'Certificate of incorporation and constitutional documents reviewed', 1),
  (3, 'Reference checks on founders/key stakeholders completed', 2),
  (3, 'Outstanding legal disputes, debts, or sanctions checked', 3),
  (3, 'Financial statements / management accounts reviewed', 4),
  (3, 'Market and competitive landscape assessed', 5),
  (4, 'Proposed equity/fee terms drafted', 1),
  (4, 'Reporting cadence agreed (weekly / biweekly / monthly)', 2),
  (4, 'Exit criteria defined', 3),
  (4, 'Engagement letter drafted for review', 4),
  (5, 'Due diligence summary presented to review team', 1),
  (5, 'Team consensus notes recorded', 2),
  (5, 'Final decision recorded (Approved / Declined / Pending Further Review)', 3),
  (6, 'Engagement letter signed', 1),
  (6, 'Portfolio company record created', 2),
  (6, 'Primary and secondary partner contacts added', 3),
  (6, 'Onboarding questionnaire sent to partner', 4),
  (6, 'First check-in scheduled', 5);

-- DECISION ESCALATION GUIDE — mirrors the 9 decision categories
insert into decision_escalation_guide (category, must_consult, notes, sort_order) values
  ('partnership', 'Director + assigned Veltron Lead', 'Any change to partnership scope or terms', 1),
  ('fundraising', 'Director + Finance Officer', 'Includes introductions to capital and round structuring', 2),
  ('scope', 'Director + assigned Veltron Lead', 'Changes to agreed engagement scope', 3),
  ('hiring', 'Director + HR Officer', 'Tier 1 — always requires Director approval', 4),
  ('legal', 'Director + Compliance Officer', 'Contracts, disputes, regulatory matters', 5),
  ('financial', 'Director + Finance Officer', 'Above the Finance Officer''s delegated threshold', 6),
  ('strategy', 'Director', 'Company-defining direction changes', 7),
  ('operations', 'Assigned Veltron Lead', 'Day-to-day — Director cc''d, not gated', 8),
  ('other', 'Director', 'Default to Director if no category fits', 9);

-- DEFAULT KNOWLEDGE BASE ARTICLES
insert into kb_articles (title, category, body, is_published) values
(
  'How to Add a New Portfolio Company',
  'guide',
  $md$# How to Add a New Portfolio Company

Portfolio companies are normally created automatically when an Engagement Intake reaches **Stage 6 — Onboarding** with a Final Decision of *Approved*. To add one manually:

1. Go to **Portfolio → Add New Portfolio** (Director or Veltron Lead only).
2. Fill in the company overview, engagement terms, and assign a Veltron Lead.
3. Set the initial health indicator (default is green).
4. Save — the company now appears in the Portfolio list and its profile tabs (KPIs, Action Items, Meetings, Documents, Decision Log) are ready to use.
$md$,
  true
),
(
  'How to Start an Engagement Intake',
  'guide',
  $md$# How to Start an Engagement Intake

1. Go to **Engagement Intake → New Intake**.
2. Enter the company name, industry, type, source, and assign an officer and lead.
3. Submitting creates the intake record with a reference number (`VPE-YY-###`) and auto-populates the 6-stage checklist from the master list.
4. Work through Stages 1–6 in order — each stage must be signed off (with no unresolved flagged items) before the next stage unlocks.
5. Stage 5 records the final decision. If approved, Stage 6 creates the portfolio company, contacts, and decision log entry.
$md$,
  true
),
(
  'Decision Escalation Guide',
  'sop',
  $md$# Decision Escalation Guide

Every decision logged in the Decision Log is categorised, and each category has a required escalation path. Consult the live table under **Decision Log → New Decision** (sidebar reference) or **Compliance → Escalation Guide** — both read from the same source so they never drift out of sync.

As a rule: anything company-defining (hiring, legal, strategy, fundraising terms) requires the Director. Day-to-day operational decisions do not need pre-approval but the Director is always visible to them in the activity feed.
$md$,
  true
),
(
  'How to Log a Decision',
  'guide',
  $md$# How to Log a Decision

1. Go to **Decision Log → Log Decision**.
2. Link it to a portfolio company, internal project, or mark it Internal.
3. Choose a category — check the Escalation Guide sidebar for who must be consulted before logging.
4. Record the decision summary, rationale, and the options considered (you can add more than one).
5. Save — a log ID (`VDL-###`) is assigned automatically.

If a later decision replaces this one, use **Supersede** on the original entry rather than editing it — the audit trail should show the history, not overwrite it.
$md$,
  true
),
(
  'How to Add an Internal Project',
  'guide',
  $md$# How to Add an Internal Project

1. Go to **Projects → New Project**.
2. Set the project type, scale, and lead.
3. Define In Scope / Out of Scope / Success Criteria — this matters later when judging whether the project is complete.
4. Add milestones and an initial budget estimate (budgets above the Finance Officer's threshold route through Approvals).
5. Use the Tasks tab's Kanban board to break work down and assign it.
$md$,
  true
),
(
  'Leave Request Process',
  'sop',
  $md$# Leave Request Process

1. Submit a request from **HR → Leave**, with type, dates, and a reason.
2. Your request goes to the Approval queue (HR Officer or Director).
3. You'll be notified in-app once it's approved or declined.
4. Approved leave appears on the shared team leave calendar so others can plan around it.
$md$,
  true
),
(
  'Expense Submission Guide',
  'sop',
  $md$# Expense Submission Guide

1. Go to **Finance → Expenses → Submit Expense**.
2. Enter amount, category, description, date, and attach a receipt.
3. Link it to a project or portfolio company if relevant.
4. Expenses under the configured threshold are approved by the Finance Officer; larger amounts route to a second approver automatically — you don't need to do anything differently, the system handles routing.
$md$,
  true
),
(
  'Conflict of Interest Policy',
  'policy',
  $md$# Conflict of Interest Policy

Any staff member who becomes aware of a financial, personal, or professional conflict — with a portfolio company, partner, vendor, or engagement under review — must declare it immediately via **Compliance → Conflict of Interest Register → Declare Conflict**.

Declaring a conflict is not an admission of wrongdoing; failing to declare one when known is the actual policy breach. The Compliance Officer (or Director, if the Compliance Officer is the subject of the conflict) reviews every declaration and records a resolution.
$md$,
  true
);

-- CEO APPROVAL POLICY — DEFAULT TIERS (Spec Section 12.2)
insert into approval_policies (category, tier, threshold_amount, threshold_currency) values
  ('engagement_decision', 1, null, 'USD'),
  ('user_management', 1, null, 'USD'),
  ('announcement', 1, null, 'USD'),
  ('hr_action', 1, null, 'USD'),
  ('finance_budget', 1, null, 'USD'),
  ('finance_expense', 2, 500, 'USD'),
  ('external_communication', 2, null, 'USD'),
  ('partner_form', 2, null, 'USD'),
  ('document_sharing', 2, null, 'USD'),
  ('compliance_item', 2, null, 'USD'),
  ('decision_log_entry', 3, null, 'USD'),
  ('operations', 3, null, 'USD');

-- DEFAULT ANNOUNCEMENT
insert into announcements (title, body, priority, pinned) values (
  'Welcome to the Veltron Portal',
  'This portal is now the operational home for Veltron Partners — portfolio management, engagement intake, decisions, projects, HR, finance, compliance, documents, and your inbox all live here. Start with the Knowledge Base for how-to guides, and reach out to a Director if anything looks off.',
  'info',
  true
);
