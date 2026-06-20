"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendChatMessage, markChannelRead, type FormState } from "@/app/(portal)/chat/actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/types";

export function ChatThread({
  channelId,
  initialMessages,
  currentUserId,
  nameById,
}: {
  channelId: string;
  initialMessages: ChatMessage[];
  currentUserId: string;
  nameById: Map<string, string>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const action = sendChatMessage.bind(null, channelId);
  const [, formAction] = useActionState<FormState, FormData>(action, undefined);

  useEffect(() => {
    setMessages(initialMessages);
  }, [channelId, initialMessages]);

  useEffect(() => {
    markChannelRead(channelId);
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          markChannelRead(channelId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  mine
                    ? "max-w-md rounded-lg bg-veltron-gold px-3 py-2 text-sm text-veltron-charcoal"
                    : "max-w-md rounded-lg bg-muted px-3 py-2 text-sm"
                }
              >
                {!mine && (
                  <p className="mb-0.5 text-xs font-medium text-text-muted">
                    {nameById.get(m.sender_id) ?? "Unknown"}
                  </p>
                )}
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className="mt-1 text-[10px] opacity-70">
                  {new Date(m.created_at).toLocaleTimeString(undefined, { timeStyle: "short" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form
        action={async (formData) => {
          const textarea = formData.get("body");
          await formAction(formData);
          if (textarea) {
            const el = document.getElementById("chat-body-input") as HTMLTextAreaElement | null;
            if (el) el.value = "";
          }
        }}
        className="flex items-end gap-2 border-t border-border p-3"
      >
        <Textarea
          id="chat-body-input"
          name="body"
          rows={1}
          placeholder="Message…"
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.currentTarget.form?.requestSubmit();
              e.preventDefault();
            }
          }}
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
