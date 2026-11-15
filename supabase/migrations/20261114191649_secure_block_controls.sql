-- Blocking is performed only through actor-bound RPCs. Client writes cannot spoof blocker_id.
revoke insert, delete on public.blocks from authenticated;

create or replace function public.block_user(p_blocked_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_blocked_user_id is null or p_blocked_user_id = v_actor then
    raise exception using errcode = '22023', message = 'Invalid account to block';
  end if;
  if not exists (select 1 from auth.users u where u.id = p_blocked_user_id) then
    raise exception using errcode = '22023', message = 'Account not found';
  end if;

  insert into public.blocks (blocker_id, blocked_id)
  values (v_actor, p_blocked_user_id)
  on conflict (blocker_id, blocked_id) do nothing;
end;
$$;

create or replace function public.unblock_user(p_blocked_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_blocked_user_id is null or p_blocked_user_id = v_actor then
    raise exception using errcode = '22023', message = 'Invalid account to unblock';
  end if;

  delete from public.blocks
  where blocker_id = v_actor and blocked_id = p_blocked_user_id;
end;
$$;

create or replace function public.get_blocked_users()
returns table (blocked_user_id uuid, display_name text, blocked_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select b.blocked_id, coalesce(p.display_name, 'Unavailable account'), b.created_at
  from public.blocks b
  left join public.profiles p on p.id = b.blocked_id
  where b.blocker_id = auth.uid()
  order by b.created_at desc
  limit 200;
$$;

revoke all on function public.block_user(uuid) from public, anon;
revoke all on function public.unblock_user(uuid) from public, anon;
revoke all on function public.get_blocked_users() from public, anon;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.unblock_user(uuid) to authenticated;
grant execute on function public.get_blocked_users() to authenticated;
