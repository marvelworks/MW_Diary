alter table public.users
  add column if not exists line_user_id text unique,
  add column if not exists line_friendship_status text default 'not_friend',
  add column if not exists notifications_enabled boolean default false;

create unique index if not exists users_line_user_id_key
  on public.users (line_user_id);
