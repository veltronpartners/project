import Link from "next/link";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { NewDirectMessageMenu } from "@/components/chat/NewDirectMessageMenu";
import { NewGroupDialog } from "@/components/chat/NewGroupDialog";
import { ChatThread } from "@/components/chat/ChatThread";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string }>;
}) {
  const user = await getCurrentStaffUser();
  const { channel: activeChannelId } = await searchParams;
  const supabase = await createClient();

  const [{ data: memberships }, { data: team }] = await Promise.all([
    supabase.from("chat_channel_members").select("channel_id, last_read_at").eq("user_id", user.id),
    supabase.from("users").select("id, full_name, username").neq("id", user.id).order("full_name"),
  ]);

  const channelIds = (memberships ?? []).map((m) => m.channel_id);
  const lastReadByChannel = new Map((memberships ?? []).map((m) => [m.channel_id, m.last_read_at]));
  const nameById = new Map((team ?? []).map((t) => [t.id, t.full_name]));
  nameById.set(user.id, user.full_name);

  const [{ data: channels }, { data: allMembers }, { data: recentMessages }] = await Promise.all([
    channelIds.length
      ? supabase.from("chat_channels").select("*").in("id", channelIds)
      : Promise.resolve({ data: [] }),
    channelIds.length
      ? supabase.from("chat_channel_members").select("channel_id, user_id").in("channel_id", channelIds)
      : Promise.resolve({ data: [] }),
    channelIds.length
      ? supabase
          .from("chat_messages")
          .select("*")
          .in("channel_id", channelIds)
          .order("created_at", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] }),
  ]);

  const lastMessageByChannel = new Map<string, ChatMessage>();
  for (const msg of (recentMessages ?? []) as ChatMessage[]) {
    if (!lastMessageByChannel.has(msg.channel_id)) lastMessageByChannel.set(msg.channel_id, msg);
  }

  const channelList = (channels ?? [])
    .map((c) => {
      let displayName = c.name;
      if (c.type === "direct") {
        const otherMemberId = (allMembers ?? []).find((m) => m.channel_id === c.id && m.user_id !== user.id)?.user_id;
        displayName = otherMemberId ? nameById.get(otherMemberId) ?? "Direct message" : "Direct message";
      }
      const lastMessage = lastMessageByChannel.get(c.id);
      const lastReadAt = lastReadByChannel.get(c.id);
      const unread = lastMessage && lastReadAt ? new Date(lastMessage.created_at) > new Date(lastReadAt) : false;
      return { ...c, displayName, lastMessage, unread };
    })
    .sort((a, b) => {
      const aTime = a.lastMessage?.created_at ?? a.created_at;
      const bTime = b.lastMessage?.created_at ?? b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

  const activeChannel = channelList.find((c) => c.id === activeChannelId) ?? channelList[0] ?? null;

  const { data: activeMessages } = activeChannel
    ? await supabase
        .from("chat_messages")
        .select("*")
        .eq("channel_id", activeChannel.id)
        .order("created_at", { ascending: true })
        .limit(200)
    : { data: [] };

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      <aside className="w-64 shrink-0 space-y-3 overflow-y-auto">
        <div className="space-y-2">
          <NewDirectMessageMenu team={team ?? []} />
          <NewGroupDialog team={team ?? []} />
        </div>
        <nav className="space-y-1">
          {channelList.length === 0 ? (
            <p className="px-2 text-sm text-text-muted">No conversations yet — start one above.</p>
          ) : (
            channelList.map((c) => (
              <Link
                key={c.id}
                href={`/chat?channel=${c.id}`}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm",
                  c.id === activeChannel?.id ? "bg-accent font-medium" : "hover:bg-muted/40",
                  c.unread && "font-semibold",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{c.displayName}</span>
                  {c.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-veltron-gold" />}
                </div>
                {c.lastMessage && (
                  <p className="truncate text-xs text-text-muted">{c.lastMessage.body}</p>
                )}
              </Link>
            ))
          )}
        </nav>
      </aside>

      <section className="flex-1 rounded-md border border-border">
        {activeChannel ? (
          <ChatThread
            channelId={activeChannel.id}
            initialMessages={(activeMessages ?? []) as ChatMessage[]}
            currentUserId={user.id}
            nameById={nameById}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmptyState message="Start a direct message or create a group to begin chatting." />
          </div>
        )}
      </section>
    </div>
  );
}
