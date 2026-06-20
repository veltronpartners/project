-- Needed so toggling a partner's report cadence updates the existing
-- schedule row instead of creating duplicates.
alter table partner_report_schedule
  add constraint partner_report_schedule_unique unique (portfolio_id, partner_contact_id);
