import "server-only";
import { simpleParser } from "mailparser";

export type ParsedMessage = {
  subject: string;
  from: string;
  to: string;
  date: string;
  html: string | null;
  text: string | null;
  attachments: { filename: string; size: number; contentType: string }[];
};

export async function parseMessage(raw: Buffer): Promise<ParsedMessage> {
  const parsed = await simpleParser(raw);
  return {
    subject: parsed.subject ?? "(no subject)",
    from: parsed.from?.text ?? "Unknown",
    to: parsed.to ? (Array.isArray(parsed.to) ? parsed.to.map((t) => t.text).join(", ") : parsed.to.text) : "",
    date: (parsed.date ?? new Date()).toISOString(),
    html: typeof parsed.html === "string" ? parsed.html : null,
    text: parsed.text ?? null,
    attachments: parsed.attachments.map((a) => ({
      filename: a.filename ?? "attachment",
      size: a.size,
      contentType: a.contentType,
    })),
  };
}
