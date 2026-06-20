-- Bug fix: audit_log.actor_id had a hard FK to users(id) only, so every
-- logAudit() call from partner-side actions (form submitted, document
-- uploaded, meeting requested, message sent) was silently rejected at
-- the database level -- the RLS check (actor_id = auth.uid()) passed,
-- but the FK then killed the insert, and logAudit() swallows errors.
-- Partners aren't rows in `users`, so there's no single table to FK
-- against; drop the FK and rely on the existing RLS policy ("audit log
-- insert own": actor_id = auth.uid()) as the integrity boundary instead.
alter table audit_log drop constraint audit_log_actor_id_fkey;
