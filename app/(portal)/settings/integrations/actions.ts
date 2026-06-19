"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { isDirector } from "@/lib/permissions";
import { encrypt } from "@/lib/encryption";
import { SLACK_EVENTS } from "@/lib/slack/events";

export type FormState = { error?: string; success?: string } | undefined;

export async function saveSlackSettings(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) return { error: "Only a Director can manage integrations." };

  const webhookUrl = (formData.get("webhook_url") ?? "").toString().trim();
  const channel = (formData.get("channel") ?? "").toString().trim();
  const events = SLACK_EVENTS.map((e) => e.key).filter((key) => formData.get(`event_${key}`) === "on");

  if (!webhookUrl) return { error: "A webhook URL is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("integration_settings").upsert(
    {
      integration: "slack",
      encrypted_secret: encrypt(webhookUrl),
      config: { channel, events },
      is_connected: true,
      last_synced_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "integration" },
  );
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "integration_settings",
    resourceName: "slack",
    newValue: { channel, events },
  });

  revalidatePath("/settings/integrations");
  return { success: "Slack connected." };
}

export async function disconnectSlack() {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) return;

  const supabase = await createClient();
  await supabase.from("integration_settings").update({ is_connected: false }).eq("integration", "slack");

  await logAudit({ actorId: user.id, action: "updated", resourceType: "integration_settings", resourceName: "slack", newValue: { disconnected: true } });
  revalidatePath("/settings/integrations");
}

export async function saveNotionSettings(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) return { error: "Only a Director can manage integrations." };

  const apiKey = (formData.get("api_key") ?? "").toString().trim();
  const databaseId = (formData.get("database_id") ?? "").toString().trim();

  if (!apiKey || !databaseId) return { error: "API key and Database ID are required." };

  const supabase = await createClient();
  const { error } = await supabase.from("integration_settings").upsert(
    {
      integration: "notion",
      encrypted_secret: encrypt(apiKey),
      config: { database_id: databaseId },
      is_connected: true,
      last_synced_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "integration" },
  );
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "integration_settings",
    resourceName: "notion",
  });

  revalidatePath("/settings/integrations");
  return { success: "Notion connected." };
}

export async function disconnectNotion() {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) return;

  const supabase = await createClient();
  await supabase.from("integration_settings").update({ is_connected: false }).eq("integration", "notion");

  await logAudit({ actorId: user.id, action: "updated", resourceType: "integration_settings", resourceName: "notion", newValue: { disconnected: true } });
  revalidatePath("/settings/integrations");
}
