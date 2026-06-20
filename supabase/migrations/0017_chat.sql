-- Username (shorter than email, used for display/mentions in chat).
alter table users add column username text unique;
update users set username = split_part(email, '@', 1) where username is null;
alter table users alter column username set not null;

create or replace function set_username_from_email()
returns trigger
language plpgsql
as $$
begin
  if new.username is null then
    new.username := split_part(new.email, '@', 1);
  end if;
  return new;
end;
$$;
create trigger trg_set_username before insert on users
  for each row execute function set_username_from_email();

-- Internal chat — group channels and direct (1:1) channels.
create table chat_channels (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('group', 'direct')),
  name text,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create table chat_channel_members (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references chat_channels(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  joined_at timestamptz default now(),
  last_read_at timestamptz default now(),
  unique (channel_id, user_id)
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references chat_channels(id) on delete cascade,
  sender_id uuid references users(id),
  body text not null check (char_length(body) <= 4000),
  created_at timestamptz default now()
);

alter table chat_channels enable row level security;
alter table chat_channel_members enable row level security;
alter table chat_messages enable row level security;

create policy "chat channels read" on chat_channels
  for select using (
    exists (select 1 from chat_channel_members m where m.channel_id = chat_channels.id and m.user_id = auth.uid())
  );
create policy "chat channels insert" on chat_channels
  for insert with check (is_staff_member());

create policy "chat members read" on chat_channel_members
  for select using (
    exists (select 1 from chat_channel_members m2 where m2.channel_id = chat_channel_members.channel_id and m2.user_id = auth.uid())
  );
create policy "chat members insert" on chat_channel_members
  for insert with check (
    user_id = auth.uid()
    or exists (select 1 from chat_channels c where c.id = channel_id and c.created_by = auth.uid())
  );
create policy "chat members update own" on chat_channel_members
  for update using (user_id = auth.uid());
create policy "chat members delete own" on chat_channel_members
  for delete using (user_id = auth.uid());

create policy "chat messages read" on chat_messages
  for select using (
    exists (select 1 from chat_channel_members m where m.channel_id = chat_messages.channel_id and m.user_id = auth.uid())
  );
create policy "chat messages insert" on chat_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (select 1 from chat_channel_members m where m.channel_id = chat_messages.channel_id and m.user_id = auth.uid())
  );

alter publication supabase_realtime add table chat_messages;
