# Veltron Partners — System Manual

This describes how the Veltron Partners system is organized: the two portals, the
eight staff roles and what each can do, how reporting lines work, and how a new
staff member or partner contact gets onboarded.

## 1. The two portals

The system is one Next.js application split into two completely separate logged-in
experiences, gated by which table an authenticated user's ID appears in:

| | **Staff Operations Portal** | **Partner Portal** |
|---|---|---|
| Who | Internal Veltron staff (8 roles, below) | External contacts at a portfolio company |
| Login | `/login` | `/partner-login` |
| Identity table | `users` | `partner_contacts` |
| Scope | Everything: deal pipeline, portfolio, finance, HR, compliance | Only their own portfolio company's data |

A staff account can never end up in the partner portal and vice versa — `proxy.ts`
checks which table the logged-in user's ID belongs to on every request and redirects
accordingly. Both portals require two-factor authentication on every account (see
§5), with no exceptions unless a director explicitly flags an account
`two_factor_exempt`.

## 2. Staff roles & responsibilities

There are 8 staff roles. Each one's access is defined centrally in
[lib/permissions.ts](lib/permissions.ts) as a level per module — `none`, `read`,
`own` (scoped to records they're tied to), `edit` (broad read/write), or `full`
(unrestricted). The database (Supabase RLS) enforces the real boundary; the matrix
below only controls what the UI shows.

**Director** — Full access to every module, no exceptions. The only role that can
create staff accounts, change anyone's role, manage 2FA resets, approve budgets,
delegate Acting CEO authority, and read the full audit log.

**Veltron Lead** — Runs specific portfolio companies, projects, and deals.
"Own"-scoped almost everywhere: can manage the portfolio companies, projects, and
decisions they lead, create new engagements and forms, full access to the Knowledge
Base (alongside Director), and read-only visibility into finance and compliance.

**Partnerships Officer** — Owns the deal pipeline end to end. Full control of
Engagement Intake (the stage-by-stage pipeline) and Contacts; edit access on
Portfolio and Decisions; read-only elsewhere. This is the role that generates
shareable lead-capture form links, reviews responses, and decides whether a lead
converts into a tracked engagement.

**Finance Officer** — Full control of the Finance module (budgets, expense
approvals); edit access on Projects; read-only on Portfolio, Decisions, and
Compliance. No access to Intake, HR, or the deal pipeline.

**HR Officer** — Full control of the HR module: staff profiles, onboarding
checklists, leave requests. Read-only visibility into what Veltron Leads are doing.
No access to Portfolio, Intake, Decisions, Finance, or Compliance.

**Compliance Officer** — Full control of Compliance (contracts, conflict-of-interest
register) and the only non-Director role with access to the Audit Log. Read-only on
Portfolio, Decisions, Intake, and Finance.

**Secretary** — Full control of Calendar/Meetings and the Document Vault. Read-only
on most other modules; no access to Finance, Compliance, or HR specifics.

**Staff** (general) — The default, lowest-privilege role. "Own"-scoped access to
their own dashboard, projects they're leading, their own HR record/leave requests,
their own document uploads, and meetings they organize. Read-only on Contacts,
Announcements, and the Knowledge Base. No access to Portfolio, Intake, Decisions,
Finance, or Compliance.

### Full permission matrix

| Module | Director | Veltron Lead | Partnerships Officer | Finance Officer | HR Officer | Compliance Officer | Secretary | Staff |
|---|---|---|---|---|---|---|---|---|
| Dashboard | full | own | own | own | own | own | own | own |
| Portfolio | full | own | edit | read | none | read | read | none |
| Engagement Intake | full | own | full | none | none | read | read | none |
| Decisions | full | own | edit | read | none | read | none | none |
| Projects | full | own | read | edit | none | read | read | own |
| Contacts | full | full | full | read | read | read | read | read |
| HR | full | read | none | none | full | none | none | own |
| Finance | full | own | none | full | none | read | none | none |
| Compliance | full | own | read | none | none | full | none | none |
| Documents | full | own | own | own | own | own | full | own |
| Knowledge Base | full | full | read | read | read | read | read | read |
| Announcements | full | read | read | read | read | read | read | read |
| Calendar | full | full | full | read | none | read | full | own |
| Reports | full | own | read | read | none | read | none | none |
| Admin (Settings → Users, Integrations, Backups) | full | none | none | none | none | none | none | none |
| Audit Log | full | none | none | none | none | full | none | none |

## 3. Reporting structure

Reporting lines aren't hard-coded by role — they're set per person. Every staff
member has a `staff_profiles` row with a `reporting_to` field (an HR Officer or
Director sets this from **HR → Staff → [person] → Profile**). In practice, today
that looks like:

- **Director** sits at the top, no one above them.
- Everyone else's `reporting_to` is set to whichever Director or Veltron Lead
  actually manages them day to day — currently every non-Director profile reports
  to the Director directly, since the team is small.

This field is informational (shown on staff profiles, used for org-chart-style
context) — it does not itself grant any system access. Access is entirely
determined by the role + permission matrix in §2, independent of who someone
reports to.

## 4. Onboarding

### 4.1 New staff member

1. A **Director** goes to **Settings → Users → Add Staff** and creates the account:
   full name, email, role, and a temporary password (minimum 8 characters). This
   creates both the Supabase Auth login and the `users` row in one step — the
   account is immediately usable, there is no separate email-invite step.
2. The Director shares the temporary password with the new hire directly (Slack,
   call, etc. — not sent automatically by the system).
3. The new hire logs in at `/login` with that password and is immediately forced
   into 2FA setup (`/2fa-setup`) before reaching anything else — this is mandatory
   for every account.
4. An **HR Officer** fills in their **HR → Staff → [person] → Profile**:
   employment type, start date, reporting line, emergency contact, etc.
5. The HR Officer adds onboarding tasks from that same profile page, each tagged
   `admin`, `system_access`, `training`, or `introductions`, with a due date and an
   owner. Progress shows up company-wide on **HR → Onboarding Tracker**.
6. There's currently no self-serve "set your own password" invite link — every
   account today goes through the Director setting a temporary password directly
   at creation time.

### 4.2 New partner contact

This is for giving an external contact at a portfolio company login access to the
Partner Portal — separate from the expirable lead-capture links used for
prospecting (§4.3).

1. From a portfolio company's page → **Partner Management → Add Contact**, staff
   (with Portfolio edit access or above) enter the contact's name, email, role
   title, and a temporary password.
2. This creates their Supabase Auth login and `partner_contacts` row together, so
   they can sign in immediately.
3. Staff share the temporary password with the contact directly.
4. The contact logs in at `/partner-login`, completes mandatory 2FA setup, and
   lands in their portfolio company's dashboard — scoped only to that company's
   data (KPIs, action items, forms, documents, meetings, messages).

### 4.3 Capturing a partnership lead (not yet a portal user)

For prospects who haven't been onboarded yet: staff generate an expirable,
tokenized link from **Forms → [a form] → Shareable Links**, optionally tagged with
the recipient's name/email and an expiry (1–90 days). The prospect fills it out
anonymously at `/respond/[token]` — no account needed. Staff review the response
under **Forms → [a form] → Leads** and either **Decline** or **Move to Intake**,
which creates a real Engagement Intake record pre-filled with their answers. Only
at that point — if the engagement progresses — would a partner contact account
(§4.2) actually get created for them.

## 5. Security notes

- **Two-factor authentication is mandatory** for every staff and partner account,
  enforced at the middleware level (`proxy.ts`), not just suggested in the UI.
- **Row-Level Security (Supabase) is the real access boundary**, not the
  permission matrix in §2 — that matrix only controls what buttons and pages the
  UI shows. Every table has its own RLS policies that independently enforce who
  can read/write what, and those are kept in sync with the matrix (see
  `supabase/migrations/0028`–`0030` for a recent fix where they'd drifted apart).
- **Every meaningful action is audit-logged** (`audit_log` table, viewable at
  **Settings → Audit Log** by Director and Compliance Officer only) — staff
  creation, role changes, portfolio/decision/document changes, and more.
