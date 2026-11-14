-- CRUSH Phase 3: server-authorized discovery and mutual matching.
-- No client can set verification status or publish a profile. Until a trusted
-- verification/admin workflow marks BOTH statuses verified and a profile visible,
-- these RPCs intentionally return no discovery results and reject interactions.

create table if not exists private.action_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (length(action) between 1 and 40),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  primary key (user_id, action)
);

revoke all on private.action_rate_limits from public, anon, authenticated;
alter table private.action_rate_limits enable row level security;

create or replace function private.consume_action_rate_limit(
  p_action text,
  p_limit integer,
  p_window interval
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_count integer;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_limit < 1 or p_window <= interval '0 seconds' then
    raise exception 'Invalid rate limit configuration' using errcode = '22023';
  end if;

  insert into private.action_rate_limits as limits
    (user_id, action, window_started_at, request_count)
  values (v_user, p_action, clock_timestamp(), 1)
  on conflict (user_id, action) do update
    set window_started_at = case
          when limits.window_started_at + p_window <= clock_timestamp()
            then clock_timestamp()
          else limits.window_started_at
        end,
        request_count = case
          when limits.window_started_at + p_window <= clock_timestamp()
            then 1
          else limits.request_count + 1
        end
  returning request_count into v_count;

  if v_count > p_limit then
    raise exception 'Rate limit exceeded' using errcode = 'P0001';
  end if;
end;
$$;
revoke all on function private.consume_action_rate_limit(text, integer, interval) from public, anon, authenticated;

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
    select 1 from private.verification_records vr
    where vr.user_id = v_user
      and vr.age_status = 'verified'
      and vr.student_status = 'verified'
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
    and vr.student_status = 'verified'
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
      where (m.user_low = least(v_user, p.id) and m.user_high = greatest(v_user, p.id))
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
      and vr.age_status = 'verified' and vr.student_status = 'verified'
  ) or not exists (
    select 1 from public.profiles p
    join private.verification_records vr on vr.user_id = p.id
    where p.id = p_recipient_id and p.visibility = 'visible' and p.dating_enabled
      and vr.age_status = 'verified' and vr.student_status = 'verified'
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
      and vr.age_status = 'verified' and vr.student_status = 'verified'
  ) or not exists (
    select 1 from public.profiles p
    join private.verification_records vr on vr.user_id = p.id
    where p.id = p_recipient_id and p.visibility = 'visible' and p.dating_enabled
      and vr.age_status = 'verified' and vr.student_status = 'verified'
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

comment on function public.discover_profiles(text, integer) is
'Returns limited safe profile fields only for mutually eligible, verified, visible accounts. Requires authenticated caller and applies rate limiting.';
comment on function public.send_like(uuid) is
'Creates a like and a match/conversation only on reciprocal likes after both users are verified, visible, enabled and unblocked.';
comment on function public.send_secret_crush(uuid) is
'Creates a secret crush and reveals a match only after reciprocal Secret Crush, with the same eligibility and block checks.';
