"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { encrypt, decrypt } from "@/lib/encryption";
import {
  generateTotpSecret,
  generateQrCodeDataUrl,
  verifyTotpCode,
  generateBackupCodes,
  hashBackupCode,
  consumeBackupCode,
} from "@/lib/auth/totp";

const STAFF_2FA_COOKIE = "veltron-2fa";
const PARTNER_2FA_COOKIE = "veltron-partner-2fa";
const STAFF_SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours (Section "Session timeout")
const PARTNER_SESSION_MAX_AGE = 60 * 60 * 4; // 4 hours (Section 10.2)

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type ActionState = { error?: string } | undefined;
export type TotpSetupState = { error?: string; backupCodes?: string[] } | undefined;

async function getActorContext(userId: string) {
  const supabase = await createClient();
  const { data: staffRow } = await supabase
    .from("users")
    .select("id, full_name, two_factor_enabled, two_factor_secret, two_factor_backup_codes")
    .eq("id", userId)
    .maybeSingle();

  if (staffRow) {
    return { table: "users" as const, isStaff: true, row: staffRow };
  }

  const { data: partnerRow } = await supabase
    .from("partner_contacts")
    .select("id, full_name, two_factor_enabled, two_factor_secret, two_factor_backup_codes")
    .eq("id", userId)
    .maybeSingle();

  return { table: "partner_contacts" as const, isStaff: false, row: partnerRow };
}

export async function login(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Incorrect email or password." };
  }

  // Mandatory 2FA every session (Section 14.1) — a fresh password sign-in
  // never inherits a previous session's verified flag.
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_2FA_COOKIE);
  cookieStore.delete(PARTNER_2FA_COOKIE);

  redirect("/2fa-verify");
}

export async function generateTotpSetupData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { isStaff, row } = await getActorContext(user.id);
  if (row?.two_factor_enabled) redirect("/2fa-verify");

  const label = `${row?.full_name ?? user.email} (${user.email})`;
  const { secretBase32, uri } = generateTotpSecret(label);
  const qrDataUrl = await generateQrCodeDataUrl(uri);

  return { secretBase32, qrDataUrl, isStaff };
}

export async function confirmTotpSetup(
  _prevState: TotpSetupState,
  formData: FormData,
): Promise<TotpSetupState> {
  const secretBase32 = String(formData.get("secretBase32") ?? "");
  const token = String(formData.get("token") ?? "").trim();

  if (!secretBase32 || !token) {
    return { error: "Enter the 6-digit code from your authenticator app." };
  }
  if (!verifyTotpCode(secretBase32, token)) {
    return { error: "That code didn't match. Check the time on your device and try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { table } = await getActorContext(user.id);
  const backupCodes = generateBackupCodes();
  const hashedCodes = backupCodes.map(hashBackupCode);

  const { error } = await supabase
    .from(table)
    .update({
      two_factor_secret: encrypt(secretBase32),
      two_factor_enabled: true,
      two_factor_backup_codes: hashedCodes,
      two_factor_setup_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Couldn't save your 2FA setup. Try again." };
  }

  const cookieStore = await cookies();
  const isStaff = table === "users";
  cookieStore.set(isStaff ? STAFF_2FA_COOKIE : PARTNER_2FA_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: isStaff ? STAFF_SESSION_MAX_AGE : PARTNER_SESSION_MAX_AGE,
  });

  return { backupCodes };
}

export async function verifyTfa(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) return { error: "Enter your 6-digit code or a backup code." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { table, row } = await getActorContext(user.id);
  if (!row?.two_factor_secret) redirect("/2fa-setup");

  const secretBase32 = decrypt(row.two_factor_secret);
  let verified = verifyTotpCode(secretBase32, token);

  if (!verified && row.two_factor_backup_codes?.length) {
    const remaining = consumeBackupCode(token, row.two_factor_backup_codes);
    if (remaining) {
      verified = true;
      await supabase
        .from(table)
        .update({ two_factor_backup_codes: remaining })
        .eq("id", user.id);
    }
  }

  if (!verified) {
    return { error: "Invalid code. Check your authenticator app or try a backup code." };
  }

  const isStaff = table === "users";
  const cookieStore = await cookies();
  cookieStore.set(isStaff ? STAFF_2FA_COOKIE : PARTNER_2FA_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: isStaff ? STAFF_SESSION_MAX_AGE : PARTNER_SESSION_MAX_AGE,
  });

  redirect(isStaff ? "/dashboard" : "/partner/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_2FA_COOKIE);
  cookieStore.delete(PARTNER_2FA_COOKIE);
  redirect("/login");
}
