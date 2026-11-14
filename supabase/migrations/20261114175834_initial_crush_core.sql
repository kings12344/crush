create extension if not exists pgcrypto;

create table public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(btrim(name)) between 1 and 160),
  country_code char(2) not null default 'SZ' check (country_code ~ '^[A-Z]{2}$'),
  created_at timestamptz not null default now()
);
create table public.campuses (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 160),
  created_at timestamptz not null default now(),
  unique (university_id, name)
);
insert into public.universities (name, country_code)
values ('University of Eswatini', 'SZ') on conflict (name) do nothing;
insert into public.campuses (university_id, name)
select id, 'Kwaluseni' from public.universities
where name = 'University of Eswatini'
on conflict (university_id, name) do nothing;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(btrim(display_name)) between 1 and 40),
  bio text check (bio is null or length(bio) <= 500),
  campus_id uuid references public.campuses(id) on delete set null,
  avatar_path text,
  visibility text not null default 'hidden' check (visibility in ('visible','hidden')),
  dating_enabled boolean not null default true,
  friendship_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_reverse_lookup on public.blocks (blocked_id, blocker_id);

create table public.likes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (sender_id, recipient_id),
  check (sender_id <> recipient_id)
);
create index likes_recipient_idx on public.likes (recipient_id, created_at desc);

create table public.secret_crushes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (sender_id, recipient_id),
  check (sender_id <> recipient_id)
);
create index secret_crush_recipient_idx on public.secret_crushes (recipient_id, created_at desc);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_low uuid not null references auth.users(id) on delete cascade,
  user_high uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_low, user_high),
  check (user_low < user_high)
);
create index matches_high_idx on public.matches (user_high, created_at desc);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index messages_conversation_time_idx on public.messages (conversation_id, created_at desc, id desc);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete set null,
  category text not null check (category in ('harassment','impersonation','underage','spam','unsafe_content','other')),
  details text check (details is null or length(details) <= 4000),
  status text not null default 'pending' check (status in ('pending','reviewing','actioned','dismissed')),
  created_at timestamptz not null default now(),
  check (target_user_id is null or reporter_id <> target_user_id)
);
create index reports_queue_idx on public.reports (status, created_at) where status in ('pending','reviewing');

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.verification_records (
  user_id uuid primary key references auth.users(id) on delete cascade,
  age_status text not null default 'pending' check (age_status in ('pending','verified','rejected','needs_review')),
  student_status text not null default 'pending' check (student_status in ('pending','verified','rejected','needs_review')),
  age_provider_ref text,
  student_provider_ref text,
  reviewed_at timestamptz,
  updated_at timestamptz not null default now()
);
revoke all on private.verification_records from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.blocks enable row level security;
alter table public.likes enable row level security;
alter table public.secret_crushes enable row level security;
alter table public.matches enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.universities enable row level security;
alter table public.campuses enable row level security;

revoke all on public.profiles, public.blocks, public.likes, public.secret_crushes,
  public.matches, public.conversations, public.messages, public.reports,
  public.universities, public.campuses from anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select, insert, delete on public.likes to authenticated;
grant insert on public.secret_crushes to authenticated;
grant select on public.matches, public.conversations, public.messages to authenticated;
grant insert on public.messages to authenticated;
grant insert on public.reports to authenticated;
grant select on public.universities, public.campuses to authenticated;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated using ((select auth.uid()) = id);

create policy "blocks_select_involved" on public.blocks for select to authenticated using ((select auth.uid()) = blocker_id or (select auth.uid()) = blocked_id);
create policy "blocks_insert_own" on public.blocks for insert to authenticated with check ((select auth.uid()) = blocker_id);
create policy "blocks_delete_own" on public.blocks for delete to authenticated using ((select auth.uid()) = blocker_id);

create policy "likes_select_sender" on public.likes for select to authenticated using ((select auth.uid()) = sender_id);
create policy "likes_insert_sender" on public.likes for insert to authenticated with check ((select auth.uid()) = sender_id);
create policy "likes_delete_sender" on public.likes for delete to authenticated using ((select auth.uid()) = sender_id);
create policy "secret_crush_insert_sender" on public.secret_crushes for insert to authenticated with check ((select auth.uid()) = sender_id);

create policy "matches_select_participant" on public.matches for select to authenticated using ((select auth.uid()) = user_low or (select auth.uid()) = user_high);
create policy "conversations_select_participant" on public.conversations for select to authenticated using (
  exists (select 1 from public.matches m where m.id = conversations.match_id
    and ((select auth.uid()) = m.user_low or (select auth.uid()) = m.user_high))
);
create policy "messages_select_participant" on public.messages for select to authenticated using (
  exists (
    select 1 from public.conversations c join public.matches m on m.id = c.match_id
    where c.id = messages.conversation_id
      and ((select auth.uid()) = m.user_low or (select auth.uid()) = m.user_high)
      and not exists (select 1 from public.blocks b
        where (b.blocker_id = m.user_low and b.blocked_id = m.user_high)
           or (b.blocker_id = m.user_high and b.blocked_id = m.user_low))
  )
);
create policy "messages_insert_active_match" on public.messages for insert to authenticated with check (
  sender_id = (select auth.uid()) and exists (
    select 1 from public.conversations c join public.matches m on m.id = c.match_id
    where c.id = messages.conversation_id
      and ((select auth.uid()) = m.user_low or (select auth.uid()) = m.user_high)
      and not exists (select 1 from public.blocks b
        where (b.blocker_id = m.user_low and b.blocked_id = m.user_high)
           or (b.blocker_id = m.user_high and b.blocked_id = m.user_low))
  )
);
create policy "reports_insert_reporter" on public.reports for insert to authenticated with check ((select auth.uid()) = reporter_id);
create policy "reports_select_reporter" on public.reports for select to authenticated using ((select auth.uid()) = reporter_id);
create policy "universities_read_authenticated" on public.universities for select to authenticated using (true);
create policy "campuses_read_authenticated" on public.campuses for select to authenticated using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "profile_photos_select_own" on storage.objects for select to authenticated using (
  bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "profile_photos_insert_own" on storage.objects for insert to authenticated with check (
  bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "profile_photos_update_own" on storage.objects for update to authenticated using (
  bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text
) with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "profile_photos_delete_own" on storage.objects for delete to authenticated using (
  bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text
);

create index if not exists profiles_campus_id_idx on public.profiles (campus_id);
create index if not exists messages_sender_id_idx on public.messages (sender_id);
create index if not exists reports_reporter_id_idx on public.reports (reporter_id);
create index if not exists reports_target_user_id_idx on public.reports (target_user_id);
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end
$$;
