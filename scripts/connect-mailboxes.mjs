import { createClient } from "@supabase/supabase-js";
import { ImapFlow } from "imapflow";
import { createCipheriv, randomBytes } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const HOST = process.env.MAIL_SERVER_HOST;
const IMAP_PORT = Number(process.env.MAIL_IMAP_PORT);
const SMTP_PORT = Number(process.env.MAIL_SMTP_PORT);

function encrypt(plaintext) {
  const key = Buffer.from(process.env.TOTP_ENCRYPTION_KEY, "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

async function testConnection(email, password) {
  const client = new ImapFlow({
    host: HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user: email, pass: password },
    logger: false,
  });
  await client.connect();
  await client.mailboxOpen("INBOX");
  await client.logout();
}

const DIRECTOR_EMAIL = "micheal.onaolapo@veltronpartners.com";

const mailboxes = [
  { email: "micheal.onaolapo@veltronpartners.com", password: process.argv[2], isShared: false },
  { email: "contact@veltronpartners.com", password: process.argv[3], isShared: true },
  { email: "partnerships@veltronpartners.com", password: process.argv[4], isShared: true },
];

const { data: director, error: directorError } = await supabase
  .from("users")
  .select("id")
  .eq("email", DIRECTOR_EMAIL)
  .single();

if (directorError || !director) {
  console.error("Couldn't find the Director account:", directorError?.message);
  process.exit(1);
}

for (const mailbox of mailboxes) {
  if (!mailbox.password) {
    console.error(`Skipping ${mailbox.email} — no password provided`);
    continue;
  }
  try {
    await testConnection(mailbox.email, mailbox.password);
  } catch (error) {
    console.error(`FAILED to connect ${mailbox.email}:`, error.message);
    continue;
  }

  const { error } = await supabase.from("mailbox_connections").upsert(
    {
      user_id: director.id,
      email_address: mailbox.email,
      is_shared: mailbox.isShared,
      encrypted_password: encrypt(mailbox.password),
      imap_host: HOST,
      imap_port: IMAP_PORT,
      smtp_host: HOST,
      smtp_port: SMTP_PORT,
      is_connected: true,
      last_connection_check: new Date().toISOString(),
    },
    { onConflict: "user_id,email_address" },
  );

  if (error) {
    console.error(`Connected ${mailbox.email} via IMAP but failed to save:`, error.message);
  } else {
    console.log(`Connected and saved: ${mailbox.email} (shared: ${mailbox.isShared})`);
  }
}
