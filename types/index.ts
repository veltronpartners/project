export type Role =
  | "director"
  | "veltron_lead"
  | "partnerships_officer"
  | "finance_officer"
  | "hr_officer"
  | "compliance_officer"
  | "secretary"
  | "staff";

export const ROLE_LABELS: Record<Role, string> = {
  director: "Director",
  veltron_lead: "Veltron Lead",
  partnerships_officer: "Partnerships Officer",
  finance_officer: "Finance Officer",
  hr_officer: "HR Officer",
  compliance_officer: "Compliance Officer",
  secretary: "Secretary / Assistant",
  staff: "General Staff",
};

export type HealthIndicator = "green" | "yellow" | "red";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  avatar_url: string | null;
  phone: string | null;
  linkedin_url: string | null;
  department: string | null;
  is_active: boolean;
  google_refresh_token: string | null;
  slack_user_id: string | null;
  two_factor_enabled: boolean;
  two_factor_setup_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortfolioCompany {
  id: string;
  name: string;
  legal_name: string | null;
  trading_name: string | null;
  industry: string | null;
  website: string | null;
  founded_date: string | null;
  hq_location: string | null;
  team_size: number | null;
  stage: "idea" | "pre-revenue" | "revenue-generating" | "scaling" | "growth" | null;
  status: "active" | "in_discussion" | "exited" | "declined" | null;
  engagement_type:
    | "partnerships"
    | "fundraising"
    | "advisory"
    | "execution"
    | "combination"
    | null;
  veltron_lead_id: string | null;
  partnership: boolean;
  fundraising: boolean;
  equity_fee_terms: string | null;
  reporting_cadence: "weekly" | "biweekly" | "monthly" | null;
  exit_criteria: string | null;
  agreement_signed: boolean;
  agreement_date: string | null;
  health_indicator: HealthIndicator | null;
  onboarded_at: string | null;
  last_checkin: string | null;
  next_checkin: string | null;
  top_priority: string | null;
  key_risk: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortfolioKpi {
  id: string;
  portfolio_id: string;
  kpi_name: string;
  target: string | null;
  current_value: string | null;
  unit: string | null;
  last_updated: string | null;
  notes: string | null;
}

export interface PortfolioAction {
  id: string;
  portfolio_id: string;
  title: string;
  owner_id: string | null;
  due_date: string | null;
  status: "pending" | "in_progress" | "complete" | "overdue";
  priority: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type EngagementOverallStatus =
  | "pending"
  | "in_progress"
  | "approved"
  | "declined"
  | "under_review";

export interface Engagement {
  id: string;
  ref_number: string;
  company_name: string;
  industry: string | null;
  engagement_type: string | null;
  source: "inbound" | "outbound" | "referral" | null;
  referred_by: string | null;
  officer_id: string | null;
  lead_id: string | null;
  current_stage: number;
  overall_status: EngagementOverallStatus;
  priority_level: "high" | "medium" | "low" | null;
  target_decision_date: string | null;
  checklist_version: string;
  date_opened: string | null;
  final_decision: "Approved" | "Declined" | "Pending Further Review" | null;
  decline_reason: string | null;
  linked_portfolio_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ChecklistItemStatus = "pending" | "complete" | "flagged" | "na";

export interface EngagementChecklistItem {
  id: string;
  engagement_id: string;
  stage: number;
  item_text: string;
  status: ChecklistItemStatus;
  officer_id: string | null;
  date_done: string | null;
  notes: string | null;
}

export interface EngagementSignoff {
  id: string;
  engagement_id: string;
  stage: number;
  officer_name: string | null;
  officer_id: string | null;
  signed_at: string;
  remarks: string | null;
}

export interface EngagementNote {
  id: string;
  engagement_id: string;
  stage: number;
  author_id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  title: string;
  meeting_type: "portfolio_checkin" | "internal" | "external" | "board" | null;
  date: string;
  duration_minutes: number | null;
  location: string | null;
  google_meet_link: string | null;
  google_calendar_event_id: string | null;
  portfolio_id: string | null;
  project_id: string | null;
  organiser_id: string | null;
  attendees: string[] | null;
  external_attendees: string | null;
  agenda: string | null;
  key_decisions: string | null;
  action_items: string | null;
  next_meeting: string | null;
  notes: string | null;
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface MailboxConnection {
  id: string;
  user_id: string;
  email_address: string;
  is_shared: boolean;
  imap_host: string;
  imap_port: number;
  smtp_host: string;
  smtp_port: number;
  is_connected: boolean;
  last_connection_check: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedMailboxAccess {
  id: string;
  mailbox_email: string;
  user_id: string;
  granted_by: string | null;
  granted_at: string;
}

export interface KbArticle {
  id: string;
  title: string;
  category: "policy" | "sop" | "guide" | "template" | "faq" | null;
  body: string | null;
  notion_page_id: string | null;
  author_id: string | null;
  last_edited_by: string | null;
  tags: string[] | null;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface SignatureRequest {
  id: string;
  document_title: string;
  source_document_url: string;
  final_signed_document_url: string | null;
  signing_method: "in_portal" | "uploaded_external";
  signing_order: "sequential" | "parallel";
  status: "draft" | "sent" | "partially_signed" | "fully_signed" | "locked";
  portfolio_id: string | null;
  engagement_id: string | null;
  contract_id: string | null;
  created_by: string | null;
  externally_signed_date: string | null;
  externally_signed_by: string | null;
  external_signing_tool: string | null;
  created_at: string;
  updated_at: string;
}

export interface SignatureSigner {
  id: string;
  signature_request_id: string;
  signer_name: string;
  signer_email: string;
  is_internal: boolean;
  internal_user_id: string | null;
  signing_sequence: number | null;
  status: "pending" | "signed" | "declined";
  signed_at: string | null;
  signature_ip_address: string | null;
  secure_link_token: string | null;
  created_at: string;
}

export interface ConflictEntry {
  id: string;
  reported_by: string | null;
  conflict_type: "financial" | "personal" | "professional" | "other" | null;
  description: string;
  parties_involved: string | null;
  related_portfolio_id: string | null;
  related_engagement_id: string | null;
  status: "open" | "under_review" | "resolved" | "noted";
  resolution: string | null;
  resolved_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

export interface Contract {
  id: string;
  contract_type:
    | "engagement_letter"
    | "mou"
    | "nda"
    | "service_agreement"
    | "employment"
    | "vendor"
    | "other"
    | null;
  title: string;
  counterparty: string | null;
  portfolio_id: string | null;
  signed_date: string | null;
  effective_date: string | null;
  expiry_date: string | null;
  renewal_date: string | null;
  status: "draft" | "pending_signature" | "active" | "expired" | "terminated";
  signed_by_veltron: string | null;
  file_url: string | null;
  gdrive_file_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceBudget {
  id: string;
  name: string;
  period_start: string | null;
  period_end: string | null;
  total_budget: number | null;
  currency: string;
  approved: boolean;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  budget_id: string | null;
  project_id: string | null;
  portfolio_id: string | null;
  submitted_by: string | null;
  category: "operations" | "travel" | "legal" | "marketing" | "payroll" | "other" | null;
  description: string;
  amount: number;
  currency: string;
  date: string | null;
  receipt_url: string | null;
  status: "pending" | "approved" | "declined" | "reimbursed";
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface StaffProfile {
  id: string;
  user_id: string;
  employment_type: "full_time" | "part_time" | "contractor" | "advisor" | null;
  start_date: string | null;
  end_date: string | null;
  contract_status: "active" | "pending_renewal" | "expired";
  contract_file_url: string | null;
  reporting_to: string | null;
  remuneration: string | null;
  performance_notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  timezone: string | null;
  location_country: string | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnboardingTask {
  id: string;
  user_id: string;
  task_name: string;
  category: "admin" | "system_access" | "training" | "introductions" | null;
  status: "pending" | "in_progress" | "complete";
  due_date: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  notes: string | null;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: "annual" | "sick" | "personal" | "unpaid" | "other" | null;
  start_date: string;
  end_date: string;
  days_count: number | null;
  reason: string | null;
  status: "pending" | "approved" | "declined";
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: "urgent" | "normal" | "info";
  posted_by: string | null;
  target_roles: string[] | null;
  slack_posted: boolean;
  pinned: boolean;
  expires_at: string | null;
  status: "pending" | "published" | "declined";
  created_at: string;
}

export interface VaultDocument {
  id: string;
  title: string;
  category:
    | "engagement"
    | "due_diligence"
    | "legal"
    | "financial"
    | "hr"
    | "templates"
    | "policies"
    | "reports"
    | null;
  description: string | null;
  file_url: string | null;
  gdrive_file_id: string | null;
  file_type: string | null;
  file_size_kb: number | null;
  portfolio_id: string | null;
  project_id: string | null;
  engagement_id: string | null;
  uploaded_by: string | null;
  version: string;
  access_level: "internal" | "director_only" | "hr_only" | "compliance_only";
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  full_name: string;
  organisation: string | null;
  role_title: string | null;
  contact_type:
    | "portfolio_contact"
    | "investor"
    | "advisor"
    | "legal"
    | "partner"
    | "vendor"
    | "other"
    | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  website: string | null;
  portfolio_id: string | null;
  status: "active" | "inactive" | "archived";
  last_contact: string | null;
  notes: string | null;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InternalProject {
  id: string;
  name: string;
  type: "product_build" | "design" | "systems" | "other" | null;
  scale: "small" | "medium" | "large" | null;
  status: "planning" | "in_progress" | "completed" | "on_hold" | "cancelled";
  lead_id: string | null;
  team_members: string[] | null;
  start_date: string | null;
  target_end_date: string | null;
  percent_complete: number;
  budget_estimated: number | null;
  budget_used: number;
  currency: string;
  budget_approved: boolean;
  in_scope: string | null;
  out_of_scope: string | null;
  success_criteria: string | null;
  top_priority: string | null;
  key_risk: string | null;
  health_indicator: HealthIndicator | null;
  linked_portfolio_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  target_date: string | null;
  status: "pending" | "in_progress" | "complete" | "delayed";
  notes: string | null;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  assignee_id: string | null;
  priority: "high" | "medium" | "low" | null;
  due_date: string | null;
  status: "pending" | "in_progress" | "complete" | "overdue";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectBudgetItem {
  id: string;
  project_id: string;
  item_name: string;
  category: string | null;
  vendor: string | null;
  estimated: number | null;
  actual: number | null;
  currency: string;
  date: string | null;
  notes: string | null;
}

export interface ProjectRisk {
  id: string;
  project_id: string;
  description: string;
  type: "risk" | "decision";
  likelihood: "high" | "medium" | "low" | null;
  impact: "high" | "medium" | "low" | null;
  mitigation: string | null;
  owner_id: string | null;
  status: "open" | "mitigated" | "resolved" | "accepted";
  linked_decision_id: string | null;
}

export type DecisionStatus =
  | "approved"
  | "in_progress"
  | "under_review"
  | "declined"
  | "superseded";

export interface Decision {
  id: string;
  log_id: string;
  date: string;
  portfolio_id: string | null;
  project_id: string | null;
  category:
    | "partnership"
    | "fundraising"
    | "scope"
    | "hiring"
    | "legal"
    | "financial"
    | "strategy"
    | "operations"
    | "other";
  decision_summary: string;
  rationale: string;
  options_considered: string;
  decision_maker_id: string | null;
  stakeholders_informed: string | null;
  status: DecisionStatus;
  due_date: string | null;
  owner_id: string | null;
  outcome_notes: string | null;
  review_date: string | null;
  superseded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  old_value: unknown;
  new_value: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type:
    | "task_due"
    | "stage_signoff"
    | "decision_logged"
    | "announcement"
    | "leave_request"
    | "flagged_item"
    | "approval_pending";
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}
