import type { Notification } from "@/types";

export type NotificationCategory = Notification["type"];

export const NOTIFICATION_CATEGORIES: { key: NotificationCategory; label: string }[] = [
  { key: "task_due", label: "Task due or overdue" },
  { key: "stage_signoff", label: "Intake stage signed off" },
  { key: "decision_logged", label: "New decision logged" },
  { key: "announcement", label: "New announcement" },
  { key: "leave_request", label: "Leave request submitted" },
  { key: "flagged_item", label: "Flagged item (form submitted, document uploaded, message received)" },
  { key: "approval_pending", label: "Approval request pending CEO" },
];

export type ChannelPrefs = { in_app: boolean; email: boolean };
export type CategoryPrefs = Record<NotificationCategory, ChannelPrefs>;

export const DEFAULT_CHANNEL_PREFS: ChannelPrefs = { in_app: true, email: false };

export function withDefaults(stored: Partial<CategoryPrefs> | null | undefined): CategoryPrefs {
  const result = {} as CategoryPrefs;
  for (const { key } of NOTIFICATION_CATEGORIES) {
    result[key] = { ...DEFAULT_CHANNEL_PREFS, ...(stored?.[key] ?? {}) };
  }
  return result;
}
