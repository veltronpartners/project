"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createNotification } from "@/lib/notifications";

export type FormState = { error?: string } | undefined;

export async function createGroupChannel(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  const name = (formData.get("name") ?? "").toString().trim();
  const memberIds = formData.getAll("member_ids").map(String);
  if (!name) return { error: "Group name is required." };
  if (memberIds.length === 0) return { error: "Add at least one other member." };

  const supabase = await createClient();
  const { data: channel, error } = await supabase
    .from("chat_channels")
    .insert({ type: "group", name, created_by: user.id })
    .select("id")
    .single();
  if (error || !channel) return { error: "Couldn't create the group: " + (error?.message ?? "") };

  const allMembers = [...new Set([user.id, ...memberIds])];
  await supabase
    .from("chat_channel_members")
    .insert(allMembers.map((id) => ({ channel_id: channel.id, user_id: id })));

  await Promise.all(
    memberIds.map((id) =>
      createNotification({
        userId: id,
        type: "flagged_item",
        title: `Added to group chat: ${name}`,
        link: `/chat?channel=${channel.id}`,
      }),
    ),
  );

  revalidatePath("/chat");
  return undefined;
}

export async function getOrCreateDirectChannel(otherUserId: string): Promise<string | null> {
  const user = await getCurrentStaffUser();
  if (otherUserId === user.id) return null;

  const supabase = await createClient();
  const { data: myChannels } = await supabase
    .from("chat_channel_members")
    .select("channel_id, chat_channels!inner(type)")
    .eq("user_id", user.id)
    .eq("chat_channels.type", "direct");

  for (const row of myChannels ?? []) {
    const { data: members } = await supabase
      .from("chat_channel_members")
      .select("user_id")
      .eq("channel_id", row.channel_id);
    const ids = (members ?? []).map((m) => m.user_id);
    if (ids.length === 2 && ids.includes(otherUserId)) {
      return row.channel_id;
    }
  }

  const { data: channel, error } = await supabase
    .from("chat_channels")
    .insert({ type: "direct", created_by: user.id })
    .select("id")
    .single();
  if (error || !channel) return null;

  await supabase.from("chat_channel_members").insert([
    { channel_id: channel.id, user_id: user.id },
    { channel_id: channel.id, user_id: otherUserId },
  ]);

  return channel.id;
}

export async function sendChatMessage(channelId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentStaffUser();
  const body = (formData.get("body") ?? "").toString().trim();
  if (!body) return undefined;

  const supabase = await createClient();
  const { error } = await supabase.from("chat_messages").insert({
    channel_id: channelId,
    sender_id: user.id,
    body,
  });
  if (error) return { error: error.message };

  await supabase
    .from("chat_channel_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("channel_id", channelId)
    .eq("user_id", user.id);

  revalidatePath("/chat");
  return undefined;
}

export async function markChannelRead(channelId: string) {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  await supabase
    .from("chat_channel_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("channel_id", channelId)
    .eq("user_id", user.id);
}
