"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  ScrollText,
  FolderKanban,
  Users,
  CalendarDays,
  PenSquare,
  UserCog,
  Wallet,
  ShieldCheck,
  FolderLock,
  BookOpen,
  Megaphone,
  Mail,
  BarChart3,
  CheckSquare,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { Role } from "@/types";
import { hasAccess, type Module } from "@/lib/permissions";
import { VeltronMark } from "@/components/shared/VeltronLogo";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { label: string; href: string; icon: typeof LayoutDashboard; module: Module }[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase, module: "portfolio" },
  { label: "Engagement Intake", href: "/intake", icon: ClipboardList, module: "intake" },
  { label: "Decision Log", href: "/decisions", icon: ScrollText, module: "decisions" },
  { label: "Projects", href: "/projects", icon: FolderKanban, module: "projects" },
  { label: "Contacts", href: "/contacts", icon: Users, module: "contacts" },
  { label: "Calendar & Meetings", href: "/calendar", icon: CalendarDays, module: "calendar" },
  { label: "Signatures & Contracts", href: "/signatures", icon: PenSquare, module: "compliance" },
  { label: "HR", href: "/hr", icon: UserCog, module: "hr" },
  { label: "Finance", href: "/finance", icon: Wallet, module: "finance" },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck, module: "compliance" },
  { label: "Document Vault", href: "/documents", icon: FolderLock, module: "documents" },
  { label: "Knowledge Base", href: "/kb", icon: BookOpen, module: "kb" },
  { label: "Announcements", href: "/announcements", icon: Megaphone, module: "announcements" },
  { label: "Email", href: "/email", icon: Mail, module: "dashboard" },
  { label: "Reports", href: "/reports", icon: BarChart3, module: "reports" },
  { label: "Approvals", href: "/approvals", icon: CheckSquare, module: "admin" },
  { label: "Settings", href: "/settings", icon: Settings, module: "admin" },
];

const STORAGE_KEY = "veltron-sidebar-collapsed";

export function Sidebar({ role }: { role: Role }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    setMounted(true);
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  }

  const items = NAV_ITEMS.filter((item) => hasAccess(role, item.module));

  return (
    <aside
      className={cn(
        "hidden flex-col bg-sidebar text-sidebar-foreground transition-all duration-200 md:flex",
        collapsed ? "w-16" : "w-[260px]",
        !mounted && "duration-0",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-5">
        <div className="flex items-center gap-2 overflow-hidden">
          <VeltronMark className="h-7 w-8 shrink-0" />
          {!collapsed && <span className="font-display text-lg font-bold">Veltron</span>}
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map(({ label, href, icon: Icon }) =>
          collapsed ? (
            <Tooltip key={href} delayDuration={200}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className="flex items-center justify-center rounded-md px-3 py-2 text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ),
        )}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
