import "server-only";
import nodemailer from "nodemailer";
import type { MailAccountCredentials } from "./imap";

export async function sendMail(
  creds: MailAccountCredentials & { smtpHost: string; smtpPort: number },
  message: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    html: string;
    fromName?: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  try {
    const transport = nodemailer.createTransport({
      host: creds.smtpHost,
      port: creds.smtpPort,
      secure: true,
      auth: { user: creds.email, pass: creds.password },
    });

    await transport.sendMail({
      from: message.fromName ? `"${message.fromName}" <${creds.email}>` : creds.email,
      to: message.to,
      cc: message.cc || undefined,
      bcc: message.bcc || undefined,
      subject: message.subject,
      html: message.html,
      headers: { "X-Mailer": "Veltron Portal" },
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Send failed" };
  }
}
