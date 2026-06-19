import "server-only";
import { ImapFlow } from "imapflow";

export type MailAccountCredentials = {
  host: string;
  port: number;
  email: string;
  password: string;
};

async function withClient<T>(
  creds: MailAccountCredentials,
  fn: (client: ImapFlow) => Promise<T>,
): Promise<T> {
  const client = new ImapFlow({
    host: creds.host,
    port: creds.port,
    secure: true,
    auth: { user: creds.email, pass: creds.password },
    logger: false,
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.logout().catch(() => undefined);
  }
}

export async function testConnection(creds: MailAccountCredentials): Promise<{ ok: boolean; error?: string }> {
  try {
    await withClient(creds, async (client) => {
      await client.mailboxOpen("INBOX");
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Connection failed" };
  }
}

export type FolderInfo = { path: string; name: string; unread: number };

export async function listFolders(creds: MailAccountCredentials): Promise<FolderInfo[]> {
  return withClient(creds, async (client) => {
    const list = await client.list({ statusQuery: { unseen: true } });
    return list.map((box) => ({
      path: box.path,
      name: box.name,
      unread: box.status?.unseen ?? 0,
    }));
  });
}

export type MessageSummary = {
  uid: number;
  subject: string;
  from: string;
  date: string;
  seen: boolean;
  flagged: boolean;
  hasAttachments: boolean;
};

export async function listMessages(
  creds: MailAccountCredentials,
  folder: string,
  limit = 50,
): Promise<MessageSummary[]> {
  return withClient(creds, async (client) => {
    const lock = await client.getMailboxLock(folder);
    try {
      const mailbox = client.mailbox;
      if (!mailbox || typeof mailbox === "boolean" || mailbox.exists === 0) return [];

      const start = Math.max(1, mailbox.exists - limit + 1);
      const messages: MessageSummary[] = [];
      for await (const msg of client.fetch(
        `${start}:${mailbox.exists}`,
        { envelope: true, flags: true, uid: true, bodyStructure: true },
      )) {
        messages.push({
          uid: msg.uid,
          subject: msg.envelope?.subject ?? "(no subject)",
          from: msg.envelope?.from?.[0]?.address ?? msg.envelope?.from?.[0]?.name ?? "Unknown",
          date: (msg.envelope?.date ?? new Date()).toISOString(),
          seen: msg.flags?.has("\\Seen") ?? false,
          flagged: msg.flags?.has("\\Flagged") ?? false,
          hasAttachments: (msg.bodyStructure?.childNodes?.length ?? 0) > 1,
        });
      }
      return messages.reverse();
    } finally {
      lock.release();
    }
  });
}

export async function fetchRawMessage(
  creds: MailAccountCredentials,
  folder: string,
  uid: number,
): Promise<Buffer | null> {
  return withClient(creds, async (client) => {
    const lock = await client.getMailboxLock(folder);
    try {
      const { content } = await client.download(String(uid), undefined, { uid: true });
      const chunks: Buffer[] = [];
      for await (const chunk of content) chunks.push(chunk as Buffer);
      return Buffer.concat(chunks);
    } catch {
      return null;
    } finally {
      lock.release();
    }
  });
}

export async function setMessageFlag(
  creds: MailAccountCredentials,
  folder: string,
  uid: number,
  flag: "\\Seen" | "\\Flagged",
  value: boolean,
): Promise<void> {
  await withClient(creds, async (client) => {
    const lock = await client.getMailboxLock(folder);
    try {
      if (value) {
        await client.messageFlagsAdd({ uid: String(uid) }, [flag], { uid: true });
      } else {
        await client.messageFlagsRemove({ uid: String(uid) }, [flag], { uid: true });
      }
    } finally {
      lock.release();
    }
  });
}

export async function moveMessage(
  creds: MailAccountCredentials,
  folder: string,
  uid: number,
  destination: string,
): Promise<void> {
  await withClient(creds, async (client) => {
    const lock = await client.getMailboxLock(folder);
    try {
      await client.messageMove(String(uid), destination, { uid: true });
    } finally {
      lock.release();
    }
  });
}

export async function searchMessages(
  creds: MailAccountCredentials,
  folder: string,
  query: string,
): Promise<MessageSummary[]> {
  return withClient(creds, async (client) => {
    const lock = await client.getMailboxLock(folder);
    try {
      const uids = await client.search({ or: [{ subject: query }, { from: query }, { body: query }] }, { uid: true });
      if (!uids || uids.length === 0) return [];
      const messages: MessageSummary[] = [];
      for await (const msg of client.fetch(uids, { envelope: true, flags: true, uid: true }, { uid: true })) {
        messages.push({
          uid: msg.uid,
          subject: msg.envelope?.subject ?? "(no subject)",
          from: msg.envelope?.from?.[0]?.address ?? "Unknown",
          date: (msg.envelope?.date ?? new Date()).toISOString(),
          seen: msg.flags?.has("\\Seen") ?? false,
          flagged: msg.flags?.has("\\Flagged") ?? false,
          hasAttachments: false,
        });
      }
      return messages.reverse();
    } finally {
      lock.release();
    }
  });
}
