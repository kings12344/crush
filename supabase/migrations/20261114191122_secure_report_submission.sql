-- Route user reports through a trusted function so clients cannot forge moderation state.
revoke insert on public.reports from authenticated;

create or replace function public.submit_report(
  p_target_user_id uuid,
  p_category text,
  p_details text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reporter uuid := auth.uid();
  v_report_id uuid;
  v_details text := nullif(btrim(p_details), '');
begin
  if v_reporter is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_category not in ('harassment','impersonation','underage','spam','unsafe_content','other') then
    raise exception 'Invalid report category' using errcode = '22023';
  end if;

  if p_target_user_id is not null then
    if p_target_user_id = v_reporter then
      raise exception 'You cannot report your own account' using errcode = '22023';
    end if;
    if not exists (select 1 from auth.users u where u.id = p_target_user_id) then
      raise exception 'Report target not found' using errcode = '22023';
    end if;
  end if;

  if v_details is not null and length(v_details) > 4000 then
    raise exception 'Report details are too long' using errcode = '22023';
  end if;

  perform private.consume_action_rate_limit('submit_report', 5, interval '1 day');

  insert into public.reports (reporter_id, target_user_id, category, details, status)
  values (v_reporter, p_target_user_id, p_category, v_details, 'pending')
  returning id into v_report_id;

  return v_report_id;
end;
$$;

revoke all on function public.submit_report(uuid, text, text) from public, anon;
grant execute on function public.submit_report(uuid, text, text) to authenticated;

comment on function public.submit_report(uuid, text, text) is
'Creates a pending user report for the authenticated reporter, validates target and category, and applies a per-user daily rate limit. Clients cannot set moderation status.';
