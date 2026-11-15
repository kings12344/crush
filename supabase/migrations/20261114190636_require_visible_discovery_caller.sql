-- Require the requesting account itself to be visible and opted into the requested mode.
-- This prevents hidden or mode-disabled accounts from browsing discovery via direct RPC calls.

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
      and own_verification.student_status = 'verified'
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
      where m.user_low = least(v_user, p.id)
        and m.user_high = greatest(v_user, p.id)
    )
  order by p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 20), 30));
end;
$$;

revoke all on function public.discover_profiles(text, integer) from public, anon;
grant execute on function public.discover_profiles(text, integer) to authenticated;

comment on function public.discover_profiles(text, integer) is
'Returns limited safe profile fields only when caller and candidates are mutually eligible, verified, visible, and opted into the requested mode. Requires authentication and applies rate limiting.';
