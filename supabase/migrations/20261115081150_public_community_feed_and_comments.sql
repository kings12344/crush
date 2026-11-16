-- Public community text feed. Personal profiles remain owner-only; this API exposes
-- only the display name attached to a published post and visible comments.
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 2000),
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamptz not null default now()
);
create index community_posts_public_created_idx
  on public.community_posts (created_at desc, id desc) where status = 'published';

create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 1000),
  status text not null default 'visible' check (status in ('visible','hidden')),
  created_at timestamptz not null default now()
);
create index community_comments_post_created_idx
  on public.community_comments (post_id, created_at asc) where status = 'visible';

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
revoke all on public.community_posts, public.community_comments from public, anon, authenticated;

create or replace function public.get_public_feed(p_limit integer default 20, p_before timestamptz default null)
returns table (
  post_id uuid,
  author_name text,
  body text,
  created_at timestamptz,
  comment_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id,
         coalesce(nullif(btrim(pr.display_name), ''), 'Campus member'),
         p.body,
         p.created_at,
         (select count(*) from public.community_comments c
          where c.post_id = p.id and c.status = 'visible')
  from public.community_posts p
  left join public.profiles pr on pr.id = p.author_id
  where p.status = 'published'
    and (p_before is null or p.created_at < p_before)
  order by p.created_at desc, p.id desc
  limit least(greatest(coalesce(p_limit, 20), 1), 30);
$$;

create or replace function public.get_post_comments(p_post_id uuid)
returns table (
  comment_id uuid,
  author_name text,
  body text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id,
         coalesce(nullif(btrim(pr.display_name), ''), 'Campus member'),
         c.body,
         c.created_at
  from public.community_comments c
  join public.community_posts p on p.id = c.post_id
  left join public.profiles pr on pr.id = c.author_id
  where c.post_id = p_post_id
    and p.status = 'published'
    and c.status = 'visible'
    and (
      auth.uid() is null
      or not exists (
        select 1 from public.blocks b
        where (b.blocker_id = auth.uid() and b.blocked_id = c.author_id)
           or (b.blocker_id = c.author_id and b.blocked_id = auth.uid())
      )
    )
  order by c.created_at asc
  limit 100;
$$;

create or replace function public.create_post_comment(p_post_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_body text := btrim(coalesce(p_body, ''));
  v_now timestamptz := now();
  v_count integer;
  v_comment_id uuid;
begin
  if v_actor is null then
    raise exception using errcode = '28000', message = 'Sign in to comment.';
  end if;
  if p_post_id is null or length(v_body) < 1 or length(v_body) > 1000 then
    raise exception using errcode = '22023', message = 'Comment must be between 1 and 1000 characters.';
  end if;
  if not exists (
    select 1 from private.verification_records v
    where v.user_id = v_actor
      and v.age_status = 'verified'
      and v.student_status = 'verified'
  ) then
    raise exception using errcode = '42501', message = 'Complete age and UNESWA student verification before commenting.';
  end if;
  if not exists (
    select 1 from public.community_posts p
    where p.id = p_post_id and p.status = 'published'
  ) then
    raise exception using errcode = '22023', message = 'This post is unavailable.';
  end if;
  if exists (
    select 1 from public.blocks b
    join public.community_posts p on p.id = p_post_id
    where (b.blocker_id = v_actor and b.blocked_id = p.author_id)
       or (b.blocker_id = p.author_id and b.blocked_id = v_actor)
  ) then
    raise exception using errcode = '42501', message = 'You cannot comment on this post.';
  end if;

  insert into private.action_rate_limits (user_id, action, window_started_at, request_count)
  values (v_actor, 'community_comment', v_now, 1)
  on conflict (user_id, action) do update
    set window_started_at = case
          when private.action_rate_limits.window_started_at < v_now - interval '10 minutes' then v_now
          else private.action_rate_limits.window_started_at end,
        request_count = case
          when private.action_rate_limits.window_started_at < v_now - interval '10 minutes' then 1
          else private.action_rate_limits.request_count + 1 end
  returning request_count into v_count;

  if v_count > 10 then
    raise exception using errcode = '42900', message = 'Comment limit reached. Try again in a few minutes.';
  end if;

  insert into public.community_comments (post_id, author_id, body)
  values (p_post_id, v_actor, v_body)
  returning id into v_comment_id;
  return v_comment_id;
end;
$$;

revoke all on function public.get_public_feed(integer, timestamptz) from public;
revoke all on function public.get_post_comments(uuid) from public;
revoke all on function public.create_post_comment(uuid, text) from public, anon;
grant execute on function public.get_public_feed(integer, timestamptz) to anon, authenticated;
grant execute on function public.get_post_comments(uuid) to anon, authenticated;
grant execute on function public.create_post_comment(uuid, text) to authenticated;
