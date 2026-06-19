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
    | "flagged_item";
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}
