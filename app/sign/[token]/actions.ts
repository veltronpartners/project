"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { recordSignature } from "@/lib/signatures/sign-flow";

export type FormState = { error?: string; success?: boolean } | undefined;

export async function signDocument(
  token: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const typedName = (formData.get("typed_name") ?? "").toString().trim();
  const agreed = formData.get("agree") === "on";

  if (!typedName) return { error: "Type your full name to sign." };
  if (!agreed) return { error: "You must confirm this constitutes your legal signature." };

  const headerList = await headers();
  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerList.get("x-real-ip") ?? null;

  const result = await recordSignature({ token, ipAddress });
  if (!result.ok) return { error: result.error };

  revalidatePath(`/sign/${token}`);
  return { success: true };
}
