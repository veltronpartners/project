import type { Notification, User } from "@/types";
import { ROLE_LABELS } from "@/types";
import { signOut } from "@/lib/auth/actions";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { MobileNav } from "@/components/layout/Sidebar";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar({ user, notifications }: { user: User; notifications: Notification[] }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-2">
        <MobileNav role={user.role} />
        <div className="text-sm text-text-muted">
          {ROLE_LABELS[user.role]} <span className="hidden text-text-muted/70 sm:inline">· @{user.username}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell notifications={notifications} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-veltron-gold-muted text-veltron-charcoal">
                  {initials(user.full_name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="font-medium">{user.full_name}</div>
              <div className="text-xs text-text-muted">@{user.username}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings/profile">Profile settings</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={signOut}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full text-left">
                  Sign out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
