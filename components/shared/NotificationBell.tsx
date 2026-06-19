"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/(portal)/notifications-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Notification } from "@/types";

export function NotificationBell({ notifications }: { notifications: Notification[] }) {
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs font-normal text-veltron-gold hover:underline"
              onClick={() => markAllNotificationsRead()}
            >
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-text-muted">You&apos;re all caught up.</p>
        ) : (
          notifications.slice(0, 10).map((n) => (
            <DropdownMenuItem key={n.id} asChild>
              <Link
                href={n.link ?? "#"}
                onClick={() => !n.is_read && markNotificationRead(n.id)}
                className="flex flex-col items-start gap-0.5 whitespace-normal"
              >
                <span className={n.is_read ? "text-text-muted" : "font-medium"}>{n.title}</span>
                {n.message && <span className="text-xs text-text-muted">{n.message}</span>}
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
