-- Remove UNESWA student verification as an eligibility requirement.
-- Trusted age assurance remains mandatory for discovery, interactions and messaging.
-- The legacy student_status column is retained for migration compatibility but is no longer consulted.

create or replace function public.discover_profiles(
  p_mode text default 'dating',
  p_limit integer default 20
) returns table (
  id uuid,
  display_name text,
  bio text,
  campus_name text,
  dating_enabled boolean,
  friendship_enabled boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_mode not in ('dating', 'friendship', 'both') then
    raise exception 'Invalid discovery mode' using errcode = '22023';
  end if;

  perform private.consume_action_rate_limit('discover', 30, interval '1 minute');

  if not exists (
    select 1
    from public.profiles own_profile
    join private.verification_records own_verification
      on own_verification.user_id = own_profile.id
    where own_profile.id = v_user
      and own_profile.visibility = 'visible'
      and own_verification.age_status = 'verified'
      and (
        (p_mode = 'dating' and own_profile.dating_enabled)
        or (p_mode = 'friendship' and own_profile.friendship_enabled)
        or (p_mode = 'both' and (own_profile.dating_enabled or own_profile.friendship_enabled))
      )
  ) then
    return;
  end if;

  return query
  select p.id, p.display_name, p.bio, c.name,
         p.dating_enabled, p.friendship_enabled
  from public.profiles p
  left join public.campuses c on c.id = p.campus_id
  join private.verification_records vr on vr.user_id = p.id
  where p.id <> v_user
    and p.visibility = 'visible'
    and vr.age_status = 'verified'
    and (
      (p_mode = 'dating' and p.dating_enabled)
      or (p_mode = 'friendship' and p.friendship_enabled)
      or (p_mode = 'both' and (p.dating_enabled or p.friendship_enabled))
    )
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = v_user and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = v_user)
    )
    and not exists (
      select 1 from public.matches m
      where m.user_low = least(v_user, p.id)
        and m.user_high = greatest(v_user, p.id)
    )
  order by p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 20), 30));
end;
$$;
revoke all on function public.discover_profiles(text, integer) from public, anon;
grant execute on function public.discover_profiles(text, integer) to authenticated;

create or replace function public.send_like(p_recipient_id uuid)
returns table (matched boolean, match_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_match_id uuid;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_recipient_id is null or p_recipient_id = v_user then
    raise exception 'Invalid recipient' using errcode = '22023';
  end if;
  perform private.consume_action_rate_limit('send_like', 100, interval '1 day');

  if not exists (
    select 1 from public.profiles p
    join private.verification_records vr on vr.user_id = p.id
    where p.id = v_user and p.visibility = 'visible' and p.dating_enabled
      and vr.age_status = 'verified'
  ) or not exists (
    select 1 from public.profiles p
    join private.verification_records vr on vr.user_id = p.id
    where p.id = p_recipient_id and p.visibility = 'visible' and p.dating_enabled
      and vr.age_status = 'verified'
  ) then
    raise exception 'Both accounts must be eligible for discovery' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = v_user and b.blocked_id = p_recipient_id)
       or (b.blocker_id = p_recipient_id and b.blocked_id = v_user)
  ) then
    raise exception 'Interaction unavailable' using errcode = '42501';
  end if;

  insert into public.likes(sender_id, recipient_id)
  values (v_user, p_recipient_id)
  on conflict (sender_id, recipient_id) do nothing;

  if exists (
    select 1 from public.likes l
    where l.sender_id = p_recipient_id and l.recipient_id = v_user
  ) then
    insert into public.matches(user_low, user_high)
    values (least(v_user, p_recipient_id), greatest(v_user, p_recipient_id))
    on conflict (user_low, user_high) do nothing;

    select m.id into v_match_id
    from public.matches m
    where m.user_low = least(v_user, p_recipient_id)
      and m.user_high = greatest(v_user, p_recipient_id);

    insert into public.conversations(match_id)
    values (v_match_id)
    on conflict (match_id) do nothing;

    return query select true, v_match_id;
  else
    return query select false, null::uuid;
  end if;
end;
$$;
revoke all on function public.send_like(uuid) from public, anon;
grant execute on function public.send_like(uuid) to authenticated;

create or replace function public.send_secret_crush(p_recipient_id uuid)
returns table (matched boolean, match_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_match_id uuid;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_recipient_id is null or p_recipient_id = v_user then
    raise exception 'Invalid recipient' using errcode = '22023';
  end if;
  perform private.consume_action_rate_limit('secret_crush', 10, interval '1 day');

  if not exists (
    select 1 from public.profiles p
    join private.verification_records vr on vr.user_id = p.id
    where p.id = v_user and p.visibility = 'visible' and p.dating_enabled
      and vr.age_status = 'verified'
  ) or not exists (
    select 1 from public.profiles p
    join private.verification_records vr on vr.user_id = p.id
    where p.id = p_recipient_id and p.visibility = 'visible' and p.dating_enabled
      and vr.age_status = 'verified'
  ) then
    raise exception 'Both accounts must be eligible for Secret Crush' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = v_user and b.blocked_id = p_recipient_id)
       or (b.blocker_id = p_recipient_id and b.blocked_id = v_user)
  ) then
    raise exception 'Interaction unavailable' using errcode = '42501';
  end if;

  insert into public.secret_crushes(sender_id, recipient_id)
  values (v_user, p_recipient_id)
  on conflict (sender_id, recipient_id) do nothing;

  if exists (
    select 1 from public.secret_crushes sc
    where sc.sender_id = p_recipient_id and sc.recipient_id = v_user
  ) then
    insert into public.matches(user_low, user_high)
    values (least(v_user, p_recipient_id), greatest(v_user, p_recipient_id))
    on conflict (user_low, user_high) do nothing;

    select m.id into v_match_id
    from public.matches m
    where m.user_low = least(v_user, p_recipient_id)
      and m.user_high = greatest(v_user, p_recipient_id);

    insert into public.conversations(match_id)
    values (v_match_id)
    on conflict (match_id) do nothing;

    return query select true, v_match_id;
  else
    return query select false, null::uuid;
  end if;
end;
$$;
revoke all on function public.send_secret_crush(uuid) from public, anon;
grant execute on function public.send_secret_crush(uuid) to authenticated;

create or replace function private.is_conversation_available(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.conversations c
    join public.matches m on m.id = c.match_id
    join private.verification_records own_v on own_v.user_id = auth.uid()
    join private.verification_records peer_v
      on peer_v.user_id = case when m.user_low = auth.uid() then m.user_high else m.user_low end
    where c.id = p_conversation_id
      and (m.user_low = auth.uid() or m.user_high = auth.uid())
      and own_v.age_status = 'verified'
      and peer_v.age_status = 'verified'
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = m.user_low and b.blocked_id = m.user_high)
           or (b.blocker_id = m.user_high and b.blocked_id = m.user_low)
      )
  );
$$;
revoke all on function private.is_conversation_available(uuid) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_conversation_available(uuid) to authenticated;

drop policy if exists "messages_select_verified_unblocked_match" on public.messages;
create policy "messages_select_age_verified_unblocked_match"
on public.messages for select to authenticated
using (private.is_conversation_available(conversation_id));

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
  ) then
    raise exception using errcode = '42501', message = 'Complete age verification before commenting.';
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

comment on function public.discover_profiles(text, integer) is
'Returns safe profile fields for visible, age-verified accounts. University student verification is not required.';
comment on function public.send_like(uuid) is
'Creates likes and reciprocal matches for visible, age-verified, enabled and unblocked accounts. University student verification is not required.';
comment on function public.send_secret_crush(uuid) is
'Creates secret crushes and reciprocal matches for visible, age-verified and unblocked accounts. University student verification is not required.';
comment on function private.is_conversation_available(uuid) is
'Allows message access only to active mutual-match participants who remain age-verified and unblocked. University student verification is not required.';
