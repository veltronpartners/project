"use client";

import { useRouter } from "next/navigation";
import { getOrCreateDirectChannel } from "@/app/(portal)/chat/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export function NewDirectMessageMenu({ team }: { team: { id: string; full_name: string; username: string }[] }) {
  const router = useRouter();

  async function startChat(userId: string) {
    const channelId = await getOrCreateDirectChannel(userId);
    if (channelId) router.push(`/chat?channel=${channelId}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start gap-2">
          <UserPlus className="h-4 w-4" />
          New direct message
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
        {team.map((m) => (
          <DropdownMenuItem key={m.id} onClick={() => startChat(m.id)}>
            {m.full_name} <span className="ml-1 text-xs text-text-muted">@{m.username}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
