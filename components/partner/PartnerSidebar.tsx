"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, FileText, FolderOpen, BarChart3, CheckSquare, CalendarDays, MessageSquare, Menu } from "lucide-react";
import { VeltronMark } from "@/components/shared/VeltronLogo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  { label: "Home", href: "/partner/dashboard", icon: Home },
  { label: "My Forms", href: "/partner/forms", icon: FileText },
  { label: "My Documents", href: "/partner/documents", icon: FolderOpen },
  { label: "My Reports", href: "/partner/reports", icon: BarChart3 },
  { label: "My Actions", href: "/partner/actions", icon: CheckSquare },
  { label: "Meetings", href: "/partner/meetings", icon: CalendarDays },
  { label: "Messages", href: "/partner/messages", icon: MessageSquare },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-2">
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function PartnerSidebar() {
  return (
    <aside className="hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <VeltronMark className="h-7 w-8" />
        <span className="font-display text-lg font-bold">Veltron</span>
      </div>
      <NavLinks />
    </aside>
  );
}

export function PartnerMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-left">
            <VeltronMark className="h-7 w-8 shrink-0" />
            <span className="font-display text-lg font-bold">Veltron</span>
          </SheetTitle>
        </SheetHeader>
        <NavLinks onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
