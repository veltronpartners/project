import Link from "next/link";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { isDirector } from "@/lib/permissions";

export default async function SettingsIndexPage() {
  const user = await getCurrentStaffUser();
  const director = isDirector(user.role);

  const links = [
    { href: "/settings/profile", label: "My Profile", description: "Name, username, password, 2FA." },
    { href: "/settings/notifications", label: "Notifications", description: "How you're notified about activity." },
    { href: "/settings/email-accounts", label: "Email Accounts", description: "Connect or manage your mailbox." },
    ...(director
      ? [
          { href: "/settings/users", label: "Users & Roles", description: "Manage staff accounts and permissions." },
          { href: "/settings/approvals", label: "Approval Routing", description: "CEO approval policy and acting CEO." },
          { href: "/settings/integrations", label: "Integrations", description: "Slack and Notion connections." },
          { href: "/settings/data-export", label: "Data Export", description: "Export modules or the full database." },
          { href: "/settings/audit-log", label: "Audit Log", description: "Every action taken across the portal." },
        ]
      : []),
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Settings</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md border border-border p-4 transition-colors hover:bg-muted/30"
          >
            <p className="font-medium">{link.label}</p>
            <p className="text-sm text-text-muted">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
