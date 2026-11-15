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
