-- Master checklist template (Spec Module 4: "auto-populates all checklist
-- items from the master list" on New Intake — the source list itself isn't
-- modeled anywhere in Section 4, so it lives here).
create table engagement_checklist_templates (
  id uuid primary key default gen_random_uuid(),
  stage integer not null check (stage between 1 and 6),
  item_text text not null,
  sort_order integer not null default 0
);
alter table engagement_checklist_templates enable row level security;
create policy "checklist templates read" on engagement_checklist_templates
  for select using (is_staff_member());
create policy "checklist templates write" on engagement_checklist_templates
  for all using (is_director());

-- Decision Escalation Guide (Spec Modules 5 & 10 reference this as a sidebar
-- / embedded document; Section 4 never defines its table).
create table decision_escalation_guide (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  must_consult text not null,
  notes text,
  sort_order integer not null default 0
);
alter table decision_escalation_guide enable row level security;
create policy "escalation guide read" on decision_escalation_guide
  for select using (is_staff_member());
create policy "escalation guide write" on decision_escalation_guide
  for all using (is_director());

-- Auto-populate checklist items from the master list on intake creation
-- (Spec Module 4: "Creates the intake and auto-populates all checklist
-- items from the master list").
create or replace function populate_engagement_checklist()
returns trigger
language plpgsql
as $$
begin
  insert into engagement_checklist_items (engagement_id, stage, item_text)
  select new.id, stage, item_text
  from engagement_checklist_templates
  order by stage, sort_order;
  return new;
end;
$$;

create trigger trg_populate_engagement_checklist after insert on engagements
  for each row execute function populate_engagement_checklist();
