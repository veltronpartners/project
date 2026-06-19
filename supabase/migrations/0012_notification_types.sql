-- Settings → Notifications (spec) lists "approval requests pending" as a
-- notification type, but the original check constraint never included it.
alter table notifications drop constraint notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('task_due', 'stage_signoff', 'decision_logged', 'announcement', 'leave_request', 'flagged_item', 'approval_pending'));
