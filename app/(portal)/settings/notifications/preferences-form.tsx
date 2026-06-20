"use client";

import { useFormStatus } from "react-dom";
import { saveNotificationPreferences } from "./actions";
import { NOTIFICATION_CATEGORIES, type CategoryPrefs } from "@/lib/notification-categories";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save preferences"}
    </Button>
  );
}

export function PreferencesForm({ initial, hasMailbox }: { initial: CategoryPrefs; hasMailbox: boolean }) {
  return (
    <form action={saveNotificationPreferences} className="space-y-4">
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Event</th>
              <th className="px-4 py-2 font-medium">In-app</th>
              <th className="px-4 py-2 font-medium">Email</th>
            </tr>
          </thead>
          <tbody>
            {NOTIFICATION_CATEGORIES.map(({ key, label }) => (
              <tr key={key} className="border-t border-border">
                <td className="px-4 py-2">{label}</td>
                <td className="px-4 py-2">
                  <Checkbox name={`${key}_in_app`} defaultChecked={initial[key].in_app} />
                </td>
                <td className="px-4 py-2">
                  <Checkbox name={`${key}_email`} defaultChecked={initial[key].email} disabled={!hasMailbox} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!hasMailbox && (
        <p className="text-xs text-text-muted">
          Connect a mailbox under Settings → Email Accounts to enable email delivery.
        </p>
      )}
      <SaveButton />
    </form>
  );
}
