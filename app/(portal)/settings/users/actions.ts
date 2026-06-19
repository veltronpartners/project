"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { isDirector } from "@/lib/permissions";
import type { Role } from "@/types";

export type FormState = { error?: string } | undefined;

const ROLES: Role[] = [
  "director",
  "veltron_lead",
  "partnerships_officer",
  "finance_officer",
  "hr_officer",
  "compliance_officer",
  "secretary",
  "staff",
];

const createUserSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  role: z.enum(ROLES as [Role, ...Role[]]),
  password: z.string().min(8, "Temporary password must be at least 8 characters"),
});

export async function createStaffAccount(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) {
    return { error: "Only a Director can create staff accounts." };
  }

  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return { error: "Couldn't create the account: " + (createError?.message ?? "unknown error") };
  }

  const { error: insertError } = await admin.from("users").insert({
    id: created.user.id,
    email: parsed.data.email,
    full_name: parsed.data.full_name,
    role: parsed.data.role,
    is_active: true,
  });
  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "Couldn't save the staff record: " + insertError.message };
  }

  await logAudit({
    actorId: user.id,
    action: "invited",
    resourceType: "user",
    resourceId: created.user.id,
    resourceName: parsed.data.full_name,
    newValue: { email: parsed.data.email, role: parsed.data.role },
  });

  revalidatePath("/settings/users");
  return undefined;
}

export async function changeUserRole(userId: string, role: Role) {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) return;

  const supabase = await createClient();
  await supabase.from("users").update({ role }).eq("id", userId);

  await logAudit({
    actorId: user.id,
    action: "role_changed",
    resourceType: "user",
    resourceId: userId,
    newValue: { role },
  });

  revalidatePath("/settings/users");
}

export async function setUserActive(userId: string, isActive: boolean) {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) return;
  if (userId === user.id) return;

  const supabase = await createClient();
  await supabase.from("users").update({ is_active: isActive }).eq("id", userId);

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "user",
    resourceId: userId,
    newValue: { is_active: isActive },
  });

  revalidatePath("/settings/users");
}

export async function resetUser2fa(userId: string) {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) return;

  const supabase = await createClient();
  await supabase
    .from("users")
    .update({
      two_factor_enabled: false,
      two_factor_secret: null,
      two_factor_backup_codes: null,
      two_factor_setup_at: null,
    })
    .eq("id", userId);

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "user",
    resourceId: userId,
    newValue: { two_factor_reset: true },
  });

  revalidatePath("/settings/users");
}
