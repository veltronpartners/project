import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "archived"
  | "signed_off"
  | "approved"
  | "declined"
  | "logged_in"
  | "invited"
  | "role_changed";

/**
 * Records an entry in audit_log. Called from every Server Action / Route
 * Handler that mutates data (Section 17 — no exceptions). actor_id must be
 * the authenticated user's id; RLS only allows inserts where that matches
 * auth.uid(), so this can't be spoofed on behalf of another user.
 */
export async function logAudit(params: {
  actorId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string | null;
  resourceName?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("audit_log").insert({
    actor_id: params.actorId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId ?? null,
    resource_name: params.resourceName ?? null,
    old_value: params.oldValue ?? null,
    new_value: params.newValue ?? null,
    ip_address: params.ipAddress ?? null,
    user_agent: params.userAgent ?? null,
  });

  if (error) {
    console.error("Failed to write audit log entry", error);
  }
}
