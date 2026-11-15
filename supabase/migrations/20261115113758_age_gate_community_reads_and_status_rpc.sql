-- Restrict community reads to authenticated, age-verified CRUSH accounts.
-- Keep the underlying tables default-deny; clients can only use these narrow RPCs.

create index if not exists community_posts_author_id_idx
  on public.community_posts (author_id);
create index if not exists community_comments_author_id_idx
  on public.community_comments (author_id);

create or replace function public.get_my_age_verification_status()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Sign in required.';
  end if;

  select vr.age_status
    into v_status
  from private.verification_records vr
  where vr.user_id = auth.uid();

  return coalesce(v_status, 'pending');
end;
$$;
revoke all on function public.get_my_age_verification_status() from public, anon;
grant execute on function public.get_my_age_verification_status() to authenticated;

create or replace function public.get_public_feed(
  p_limit integer default 20,
  p_before timestamptz default null
)
returns table (
  post_id uuid,
  author_name text,
  body text,
  created_at timestamptz,
  comment_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception using errcode = '28000', message = 'Sign in to view the community feed.';
  end if;

  if not exists (
    select 1
    from private.verification_records vr
    where vr.user_id = v_actor
      and vr.age_status = 'verified'
  ) then
    raise exception using errcode = '42501', message = 'Age verification is required.';
  end if;

  return query
  select p.id,
         coalesce(nullif(btrim(pr.display_name), ''), 'CRUSH member'),
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
end;
$$;

create or replace function public.get_post_comments(p_post_id uuid)
returns table (
  comment_id uuid,
  author_name text,
  body text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception using errcode = '28000', message = 'Sign in to view comments.';
  end if;

  if p_post_id is null then
    raise exception using errcode = '22023', message = 'A post is required.';
  end if;

  if not exists (
    select 1
    from private.verification_records vr
    where vr.user_id = v_actor
      and vr.age_status = 'verified'
  ) then
    raise exception using errcode = '42501', message = 'Age verification is required.';
  end if;

  return query
  select c.id,
         coalesce(nullif(btrim(pr.display_name), ''), 'CRUSH member'),
         c.body,
         c.created_at
  from public.community_comments c
  join public.community_posts p on p.id = c.post_id
  left join public.profiles pr on pr.id = c.author_id
  where c.post_id = p_post_id
    and p.status = 'published'
    and c.status = 'visible'
    and not exists (
      select 1
      from public.blocks b
      where (b.blocker_id = v_actor and b.blocked_id in (c.author_id, p.author_id))
         or (b.blocked_id = v_actor and b.blocker_id in (c.author_id, p.author_id))
    )
  order by c.created_at asc
  limit 100;
end;
$$;

revoke all on function public.get_public_feed(integer, timestamptz) from public, anon, authenticated;
revoke all on function public.get_post_comments(uuid) from public, anon, authenticated;
grant execute on function public.get_public_feed(integer, timestamptz) to authenticated;
grant execute on function public.get_post_comments(uuid) to authenticated;
