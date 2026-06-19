"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { generateBackupCodes, hashBackupCode } from "@/lib/auth/totp";

export type FormState = { error?: string; success?: string } | undefined;

const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  linkedin_url: z.string().optional(),
});

export async function updateProfile(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentStaffUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      linkedin_url: parsed.data.linkedin_url || null,
    })
    .eq("id", user.id);
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "user_profile",
    resourceId: user.id,
    newValue: parsed.data,
  });

  revalidatePath("/settings/profile");
  return { success: "Profile updated." };
}

const passwordSchema = z
  .object({
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export async function changePassword(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.new_password });
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "user_password",
    resourceId: user.id,
  });

  return { success: "Password updated." };
}

export async function regenerateBackupCodes(): Promise<{ codes?: string[]; error?: string }> {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  const codes = generateBackupCodes();
  const hashed = codes.map(hashBackupCode);

  const { error } = await supabase
    .from("users")
    .update({ two_factor_backup_codes: hashed })
    .eq("id", user.id);
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "user_2fa",
    resourceId: user.id,
    newValue: { backup_codes_regenerated: true },
  });

  return { codes };
}
