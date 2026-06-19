import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/types";

export async function createNotification(params: {
  userId: string;
  type: Notification["type"];
  title: string;
  message?: string;
  link?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message ?? null,
    link: params.link ?? null,
  });
  if (error) {
    console.error("Failed to create notification", error);
  }
}

export async function notifyMany(
  userIds: string[],
  params: Omit<Parameters<typeof createNotification>[0], "userId">,
) {
  await Promise.all(
    [...new Set(userIds)].map((userId) => createNotification({ ...params, userId })),
  );
}
