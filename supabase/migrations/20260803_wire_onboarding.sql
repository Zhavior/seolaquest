begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  user_class text not null,
  level integer not null default 1 check (level >= 1),
  current_xp integer not null default 0 check (current_xp >= 0),
  max_xp integer not null default 1000 check (max_xp > 0),
  current_mp integer not null default 50 check (current_mp >= 0),
  max_mp integer not null default 100 check (max_mp > 0),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint profiles_username_length check (char_length(username) between 3 and 32),
  constraint profiles_user_class_length check (char_length(user_class) between 2 and 50),
  constraint profiles_xp_bounds check (current_xp <= max_xp),
  constraint profiles_mp_bounds check (current_mp <= max_mp)
);

create unique index if not exists profiles_username_key
  on public.profiles (lower(username));

create table if not exists public.tracked_keywords (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  keyword text not null,
  category text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint tracked_keywords_keyword_length check (char_length(keyword) between 1 and 120),
  constraint tracked_keywords_category_length check (char_length(category) between 1 and 50)
);

create unique index if not exists tracked_keywords_user_keyword_category_key
  on public.tracked_keywords (user_id, lower(keyword), lower(category));

create index if not exists tracked_keywords_user_id_idx
  on public.tracked_keywords (user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    username,
    user_class,
    level,
    current_xp,
    max_xp,
    current_mp,
    max_mp,
    onboarding_completed
  )
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
      'PLAYER-' || upper(substr(replace(new.id::text, '-', ''), 1, 8))
    ),
    'Scout',
    1,
    0,
    1000,
    50,
    100,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.tracked_keywords enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "tracked_keywords_select_own" on public.tracked_keywords;
create policy "tracked_keywords_select_own"
on public.tracked_keywords
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "tracked_keywords_insert_own" on public.tracked_keywords;
create policy "tracked_keywords_insert_own"
on public.tracked_keywords
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "tracked_keywords_update_own" on public.tracked_keywords;
create policy "tracked_keywords_update_own"
on public.tracked_keywords
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "tracked_keywords_delete_own" on public.tracked_keywords;
create policy "tracked_keywords_delete_own"
on public.tracked_keywords
for delete
to authenticated
using (auth.uid() = user_id);

commit;
