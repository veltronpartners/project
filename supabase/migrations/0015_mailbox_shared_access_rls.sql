-- The original "mailbox connections rw" policy only let the connecting
-- user (or Director) see a mailbox_connections row. That silently broke
-- shared mailbox access (Section 11.3) — a staff member granted access via
-- shared_mailbox_access still couldn't see the connection row at all.
drop policy "mailbox connections rw" on mailbox_connections;

create policy "mailbox connections read" on mailbox_connections
  for select using (
    user_id = auth.uid()
    or is_director()
    or (
      is_shared
      and exists (
        select 1 from shared_mailbox_access sma
        where sma.mailbox_email = mailbox_connections.email_address
        and sma.user_id = auth.uid()
      )
    )
  );

create policy "mailbox connections write" on mailbox_connections
  for all using (user_id = auth.uid() or is_director());
