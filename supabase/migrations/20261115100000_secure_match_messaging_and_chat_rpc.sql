-- CRUSH messaging UI integration: enforce verified, unblocked match access on every message read/write.
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
      and own_v.student_status = 'verified'
      and peer_v.age_status = 'verified'
      and peer_v.student_status = 'verified'
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

drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_verified_unblocked_match"
on public.messages for select to authenticated
using (public.is_conversation_available(conversation_id));

drop policy if exists "messages_insert_active_match" on public.messages;
revoke insert on public.messages from anon, authenticated;

create or replace function public.get_my_conversations()
returns table (
  conversation_id uuid,
  peer_id uuid,
  peer_name text,
  last_message text,
  last_message_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id,
         case when m.user_low = auth.uid() then m.user_high else m.user_low end,
         coalesce(nullif(btrim(p.display_name), ''), 'Campus member'),
         latest.body,
         latest.created_at
  from public.conversations c
  join public.matches m on m.id = c.match_id
  join public.profiles p
    on p.id = case when m.user_low = auth.uid() then m.user_high else m.user_low end
  left join lateral (
    select msg.body, msg.created_at
    from public.messages msg
    where msg.conversation_id = c.id
    order by msg.created_at desc, msg.id desc
    limit 1
  ) latest on true
  where (m.user_low = auth.uid() or m.user_high = auth.uid())
    and private.is_conversation_available(c.id)
  order by coalesce(latest.created_at, c.created_at) desc
  limit 100;
$$;
revoke all on function public.get_my_conversations() from public, anon;
grant execute on function public.get_my_conversations() to authenticated;

create or replace function public.send_message(p_conversation_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_body text := btrim(coalesce(p_body, ''));
  v_message_id uuid;
begin
  if v_actor is null then
    raise exception using errcode = '28000', message = 'Sign in to send a message.';
  end if;
  if p_conversation_id is null or length(v_body) < 1 or length(v_body) > 5000 then
    raise exception using errcode = '22023', message = 'Message must be between 1 and 5000 characters.';
  end if;
  if not private.is_conversation_available(p_conversation_id) then
    raise exception using errcode = '42501', message = 'This conversation is unavailable.';
  end if;

  perform private.consume_action_rate_limit('send_message', 30, interval '1 minute');

  insert into public.messages (conversation_id, sender_id, body)
  values (p_conversation_id, v_actor, v_body)
  returning id into v_message_id;

  return v_message_id;
end;
$$;
revoke all on function public.send_message(uuid, text) from public, anon;
grant execute on function public.send_message(uuid, text) to authenticated;

comment on function public.get_my_conversations() is
'Lists only the authenticated user’s verified, unblocked mutual-match conversations and exposes the peer display name plus latest message preview.';
comment on function public.send_message(uuid, text) is
'Sends a message only as auth.uid() into an active mutual-match conversation where both users remain verified and neither has blocked the other; applies a per-user rate limit.';
