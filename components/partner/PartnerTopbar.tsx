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
import { signOut } from "@/lib/auth/actions";
import { PartnerMobileNav } from "@/components/partner/PartnerSidebar";
import { PartnerNotificationBell } from "@/components/partner/PartnerNotificationBell";
import type { PartnerContact, PartnerNotification } from "@/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PartnerTopbar({
  partner,
  notifications,
}: {
  partner: PartnerContact;
  notifications: PartnerNotification[];
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-2">
        <PartnerMobileNav />
        <div className="text-sm text-text-muted">Partner Portal</div>
      </div>
      <div className="flex items-center gap-3">
        <PartnerNotificationBell notifications={notifications} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-veltron-gold-muted text-veltron-charcoal">
                  {initials(partner.full_name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="font-medium">{partner.full_name}</div>
              <div className="text-xs text-text-muted">{partner.email}</div>
            </DropdownMenuLabel>
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
