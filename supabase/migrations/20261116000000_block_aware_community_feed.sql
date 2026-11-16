-- Respect blocks in the community feed as well as in comment and chat views.
-- A blocked author must not appear in the caller's feed in either direction.
-- Comment counts must use the same visibility rule as get_post_comments.

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
         (
           select count(*)
           from public.community_comments c
           where c.post_id = p.id
             and c.status = 'visible'
             and not exists (
               select 1
               from public.blocks b
               where (b.blocker_id = v_actor and b.blocked_id = c.author_id)
                  or (b.blocked_id = v_actor and b.blocker_id = c.author_id)
             )
         )
  from public.community_posts p
  left join public.profiles pr on pr.id = p.author_id
  where p.status = 'published'
    and (p_before is null or p.created_at < p_before)
    and not exists (
      select 1
      from public.blocks b
      where (b.blocker_id = v_actor and b.blocked_id = p.author_id)
         or (b.blocked_id = v_actor and b.blocker_id = p.author_id)
    )
  order by p.created_at desc, p.id desc
  limit least(greatest(coalesce(p_limit, 20), 1), 30);
end;
$$;

revoke all on function public.get_public_feed(integer, timestamptz) from public, anon, authenticated;
grant execute on function public.get_public_feed(integer, timestamptz) to authenticated;

comment on function public.get_public_feed(integer, timestamptz) is
'Returns published community posts only to authenticated age-verified users, excludes authors blocked in either direction, and counts only visible comments not hidden by either-direction blocks.';
