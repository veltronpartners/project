-- Company-wide announcements are Tier 1 (Section 12.2) and must route through
-- the approval queue before going live — but the announcements table as
-- speced has no field to hold a not-yet-approved draft. Add one.
alter table announcements
  add column status text not null default 'pending' check (status in ('pending', 'published', 'declined'));
