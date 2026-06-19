-- Needed so connecting (or reconnecting) the same mailbox updates the
-- existing row instead of creating a duplicate.
alter table mailbox_connections
  add constraint mailbox_connections_user_email_unique unique (user_id, email_address);
