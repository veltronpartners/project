import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { isDirector } from "@/lib/permissions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ConnectForm } from "./connect-form";
import { MailboxRow } from "./mailbox-row";
import { ShareAccessForm } from "./share-access-form";
import type { MailboxConnection, SharedMailboxAccess } from "@/types";

export default async function EmailAccountsPage() {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  let connectionsQuery = supabase.from("mailbox_connections").select("*").order("created_at");
  if (!isDirector(user.role)) connectionsQuery = connectionsQuery.eq("user_id", user.id);
  const { data: connections } = await connectionsQuery;
  const rows = (connections ?? []) as MailboxConnection[];

  const ownerIds = [...new Set(rows.map((c) => c.user_id))];
  const { data: owners } = ownerIds.length
    ? await supabase.from("users").select("id, full_name").in("id", ownerIds)
    : { data: [] as { id: string; full_name: string }[] };
  const nameById = new Map((owners ?? []).map((o) => [o.id, o.full_name]));

  let sharedSection = null;
  if (isDirector(user.role)) {
    const [{ data: sharedConnections }, { data: team }, { data: access }] = await Promise.all([
      supabase.from("mailbox_connections").select("email_address").eq("is_shared", true),
      supabase.from("users").select("id, full_name").order("full_name"),
      supabase.from("shared_mailbox_access").select("*"),
    ]);
    const sharedMailboxes = [...new Set((sharedConnections ?? []).map((c) => c.email_address))];
    if (sharedMailboxes.length > 0) {
      sharedSection = (
        <ShareAccessForm
          sharedMailboxes={sharedMailboxes}
          team={team ?? []}
          access={(access ?? []) as SharedMailboxAccess[]}
          nameById={nameById}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Email Accounts</h1>

      <ConnectForm isDirector={isDirector(user.role)} />

      {rows.length === 0 ? (
        <EmptyState message="No mailboxes connected yet." />
      ) : (
        <div className="space-y-2">
          {rows.map((c) => (
            <MailboxRow key={c.id} connection={c} ownerName={nameById.get(c.user_id) ?? "—"} />
          ))}
        </div>
      )}

      {sharedSection}
    </div>
  );
}
