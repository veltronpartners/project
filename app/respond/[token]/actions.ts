"use server";

import { z } from "zod";
import {
  recordLeadSubmission,
  uploadLeadFieldFile,
  getLeadFieldFileUrl,
} from "@/lib/leads/link-flow";

export type SubmitState = { error?: string; success?: boolean } | undefined;

const respondentSchema = z.object({
  respondent_name: z.string().min(1, "Your name is required"),
  respondent_email: z.string().email("Enter a valid email address"),
  respondent_company: z.string().optional(),
  answers: z.string(),
});

export async function submitLeadResponse(token: string, _prevState: SubmitState, formData: FormData): Promise<SubmitState> {
  const parsed = respondentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };

  let answers: Record<string, unknown>;
  try {
    answers = JSON.parse(parsed.data.answers);
  } catch {
    return { error: "Something went wrong reading your answers — please try again." };
  }

  const result = await recordLeadSubmission({
    token,
    respondentName: parsed.data.respondent_name,
    respondentEmail: parsed.data.respondent_email,
    respondentCompany: parsed.data.respondent_company,
    answers,
  });
  if (!result.ok) return { error: result.error };

  return { success: true };
}

export async function uploadLeadFile(token: string, fieldId: string, file: File) {
  return uploadLeadFieldFile(token, fieldId, file);
}

export async function viewLeadFile(path: string) {
  return getLeadFieldFileUrl(path);
}
