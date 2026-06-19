import Link from "next/link";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { listFolders, listMessages, fetchRawMessage } from "@/lib/mail/imap";
import { parseMessage } from "@/lib/mail/parser";
import { sanitizeEmailHtml } from "@/lib/mail/sanitize";
import { getMailboxCredentials } from "./actions";
import { MailboxSwitcher } from "@/components/email/MailboxSwitcher";
import { FolderList } from "@/components/email/FolderList";
import { MessageList } from "@/components/email/MessageList";
import { MessageActions } from "@/components/email/MessageActions";
import { ComposeDialog } from "@/components/email/ComposeDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";

export default async function EmailPage({
  searchParams,
}: {
  searchParams: Promise<{ mailbox?: string; folder?: string; uid?: string }>;
}) {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  const { data: ownMailboxes } = await supabase
    .from("mailbox_connections")
    .select("email_address")
    .eq("user_id", user.id)
    .eq("is_connected", true);

  const { data: sharedAccess } = await supabase
    .from("shared_mailbox_access")
    .select("mailbox_email")
    .eq("user_id", user.id);

  const mailboxes = [
    ...new Set([
      ...(ownMailboxes ?? []).map((m) => m.email_address),
      ...(sharedAccess ?? []).map((s) => s.mailbox_email),
    ]),
  ];

  if (mailboxes.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-semibold">Email</h1>
        <EmptyState message="No mailbox connected yet." />
        <Button asChild>
          <Link href="/settings/email-accounts">Connect your mailbox</Link>
        </Button>
      </div>
    );
  }

  const params = await searchParams;
  const activeMailbox = params.mailbox && mailboxes.includes(params.mailbox) ? params.mailbox : mailboxes[0];
  const creds = await getMailboxCredentials(activeMailbox);

  if (!creds) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-semibold">Email</h1>
        <EmptyState message="Couldn't access this mailbox. Reconnect it from Settings → Email Accounts." />
      </div>
    );
  }

  let folders: Awaited<ReturnType<typeof listFolders>> = [];
  let folderError: string | null = null;
  try {
    folders = await listFolders(creds);
  } catch (error) {
    folderError = error instanceof Error ? error.message : "Couldn't load folders.";
  }

  const activeFolder = params.folder ?? "INBOX";

  let messages: Awaited<ReturnType<typeof listMessages>> = [];
  if (!folderError) {
    try {
      messages = await listMessages(creds, activeFolder);
    } catch (error) {
      folderError = error instanceof Error ? error.message : "Couldn't load messages.";
    }
  }

  const activeUid = params.uid ? Number(params.uid) : null;
  let activeMessage: Awaited<ReturnType<typeof parseMessage>> | null = null;
  if (activeUid) {
    const raw = await fetchRawMessage(creds, activeFolder, activeUid);
    if (raw) activeMessage = await parseMessage(raw);
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      <aside className="w-56 shrink-0 space-y-3 overflow-y-auto">
        <ComposeDialog mailboxes={mailboxes} defaultFrom={activeMailbox} />
        <MailboxSwitcher mailboxes={mailboxes} active={activeMailbox} />
        <FolderList folders={folders} mailbox={activeMailbox} activeFolder={activeFolder} />
      </aside>

      <section className="w-80 shrink-0 overflow-y-auto rounded-md border border-border">
        {folderError ? (
          <p className="p-4 text-sm text-danger">{folderError}</p>
        ) : (
          <MessageList messages={messages} mailbox={activeMailbox} folder={activeFolder} activeUid={activeUid} />
        )}
      </section>

      <section className="flex-1 overflow-y-auto rounded-md border border-border p-4">
        {!activeMessage ? (
          <EmptyState message="Select a message to read it." />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">{activeMessage.subject}</h2>
              {activeUid && (
                <MessageActions
                  mailbox={activeMailbox}
                  folder={activeFolder}
                  uid={activeUid}
                  flagged={messages.find((m) => m.uid === activeUid)?.flagged ?? false}
                />
              )}
            </div>
            <div className="text-sm text-text-muted">
              <p>From: {activeMessage.from}</p>
              <p>To: {activeMessage.to}</p>
              <p>{new Date(activeMessage.date).toLocaleString()}</p>
            </div>
            {activeMessage.html ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(activeMessage.html) }}
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm">{activeMessage.text}</p>
            )}
            {activeMessage.attachments.length > 0 && (
              <div className="space-y-1 border-t border-border pt-2">
                <p className="text-xs font-medium text-text-muted">Attachments</p>
                {activeMessage.attachments.map((a, i) => (
                  <p key={i} className="text-xs text-text-muted">
                    {a.filename} ({Math.round(a.size / 1024)} KB)
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
