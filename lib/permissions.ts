import type { Role } from "@/types";

export type Module =
  | "dashboard"
  | "portfolio"
  | "intake"
  | "decisions"
  | "projects"
  | "contacts"
  | "hr"
  | "finance"
  | "compliance"
  | "documents"
  | "kb"
  | "announcements"
  | "calendar"
  | "reports"
  | "admin"
  | "audit_log";

/**
 * full = unrestricted; edit = read/write on records the role is entitled to;
 * own = read/write scoped to the actor's own records; read = read-only;
 * none = no access. This mirrors the matrix in spec Section 3.2 — it is a UI
 * gating layer only. Supabase RLS is the actual security boundary.
 */
export type AccessLevel = "full" | "edit" | "read" | "own" | "none";

const LEVEL_RANK: Record<AccessLevel, number> = {
  none: 0,
  read: 1,
  own: 2,
  edit: 3,
  full: 4,
};

const MATRIX: Record<Module, Record<Role, AccessLevel>> = {
  dashboard: {
    director: "full",
    veltron_lead: "own",
    partnerships_officer: "own",
    finance_officer: "own",
    hr_officer: "own",
    compliance_officer: "own",
    secretary: "own",
    staff: "own",
  },
  portfolio: {
    director: "full",
    veltron_lead: "own",
    partnerships_officer: "edit",
    finance_officer: "read",
    hr_officer: "none",
    compliance_officer: "read",
    secretary: "read",
    staff: "none",
  },
  intake: {
    director: "full",
    veltron_lead: "own",
    partnerships_officer: "full",
    finance_officer: "none",
    hr_officer: "none",
    compliance_officer: "read",
    secretary: "read",
    staff: "none",
  },
  decisions: {
    director: "full",
    veltron_lead: "own",
    partnerships_officer: "edit",
    finance_officer: "read",
    hr_officer: "none",
    compliance_officer: "read",
    secretary: "none",
    staff: "none",
  },
  projects: {
    director: "full",
    veltron_lead: "own",
    partnerships_officer: "read",
    finance_officer: "edit",
    hr_officer: "none",
    compliance_officer: "read",
    secretary: "read",
    staff: "own",
  },
  contacts: {
    director: "full",
    veltron_lead: "full",
    partnerships_officer: "full",
    finance_officer: "read",
    hr_officer: "read",
    compliance_officer: "read",
    secretary: "read",
    staff: "read",
  },
  hr: {
    director: "full",
    veltron_lead: "read",
    partnerships_officer: "none",
    finance_officer: "none",
    hr_officer: "full",
    compliance_officer: "none",
    secretary: "none",
    staff: "own",
  },
  finance: {
    director: "full",
    veltron_lead: "own",
    partnerships_officer: "none",
    finance_officer: "full",
    hr_officer: "none",
    compliance_officer: "read",
    secretary: "none",
    staff: "none",
  },
  compliance: {
    director: "full",
    veltron_lead: "own",
    partnerships_officer: "read",
    finance_officer: "none",
    hr_officer: "none",
    compliance_officer: "full",
    secretary: "none",
    staff: "none",
  },
  documents: {
    director: "full",
    veltron_lead: "own",
    partnerships_officer: "own",
    finance_officer: "own",
    hr_officer: "own",
    compliance_officer: "own",
    secretary: "full",
    staff: "own",
  },
  kb: {
    director: "full",
    veltron_lead: "full",
    partnerships_officer: "full",
    finance_officer: "full",
    hr_officer: "full",
    compliance_officer: "full",
    secretary: "full",
    staff: "full",
  },
  announcements: {
    director: "full",
    veltron_lead: "read",
    partnerships_officer: "read",
    finance_officer: "read",
    hr_officer: "read",
    compliance_officer: "read",
    secretary: "read",
    staff: "read",
  },
  calendar: {
    director: "full",
    veltron_lead: "full",
    partnerships_officer: "full",
    finance_officer: "read",
    hr_officer: "none",
    compliance_officer: "read",
    secretary: "full",
    staff: "own",
  },
  reports: {
    director: "full",
    veltron_lead: "own",
    partnerships_officer: "read",
    finance_officer: "read",
    hr_officer: "none",
    compliance_officer: "read",
    secretary: "none",
    staff: "none",
  },
  admin: {
    director: "full",
    veltron_lead: "none",
    partnerships_officer: "none",
    finance_officer: "none",
    hr_officer: "none",
    compliance_officer: "none",
    secretary: "none",
    staff: "none",
  },
  audit_log: {
    director: "full",
    veltron_lead: "none",
    partnerships_officer: "none",
    finance_officer: "none",
    hr_officer: "none",
    compliance_officer: "full",
    secretary: "none",
    staff: "none",
  },
};

export function getAccessLevel(role: Role, module: Module): AccessLevel {
  return MATRIX[module][role];
}

export function hasAccess(role: Role, module: Module): boolean {
  return getAccessLevel(role, module) !== "none";
}

/** True if the role can create/edit records in this module (own-scoped or unrestricted). */
export function canEdit(role: Role, module: Module): boolean {
  return LEVEL_RANK[getAccessLevel(role, module)] >= LEVEL_RANK.own;
}

export function meetsLevel(
  role: Role,
  module: Module,
  minLevel: AccessLevel,
): boolean {
  return LEVEL_RANK[getAccessLevel(role, module)] >= LEVEL_RANK[minLevel];
}

export function isDirector(role: Role): boolean {
  return role === "director";
}
