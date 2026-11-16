-- Run with: supabase test db
-- Catalog assertions cover the authorization boundary. Two-account behavioral
-- tests remain required before enabling production discovery.
begin;
select plan(62);

select has_table('private', 'verification_records', 'verification records are private');
select has_table('private', 'action_rate_limits', 'rate-limit state is private');
select ok((select c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='profiles'), 'profiles has RLS enabled');
select ok((select c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='private' and c.relname='verification_records'), 'verification records have RLS enabled');
select ok((select c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='private' and c.relname='action_rate_limits'), 'rate-limit state has RLS enabled');

select ok(not has_function_privilege('anon','public.discover_profiles(text,integer)','EXECUTE'),'anon cannot execute discovery');
select ok(has_function_privilege('authenticated','public.discover_profiles(text,integer)','EXECUTE'),'authenticated can call guarded discovery');
select ok(not has_function_privilege('anon','public.send_like(uuid)','EXECUTE'),'anon cannot send likes');
select ok(has_function_privilege('authenticated','public.send_like(uuid)','EXECUTE'),'authenticated can call guarded like RPC');
select ok(not has_function_privilege('anon','public.send_secret_crush(uuid)','EXECUTE'),'anon cannot send Secret Crush');
select ok(has_function_privilege('authenticated','public.send_secret_crush(uuid)','EXECUTE'),'authenticated can call guarded Secret Crush RPC');
select ok(not has_function_privilege('authenticated','private.consume_action_rate_limit(text,integer,interval)','EXECUTE'),'clients cannot invoke the private rate-limit helper');
select ok(not has_function_privilege('authenticated','private.initialize_verification_record()','EXECUTE'),'clients cannot invoke the Auth verification trigger function');

select ok((select count(*)=2 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname=any(array['consume_action_rate_limit','initialize_verification_record']) and p.prosecdef and coalesce(p.proconfig,array[]::text[]) @> array['search_path=""']) and not has_function_privilege('anon','private.consume_action_rate_limit(text,integer,interval)','EXECUTE') and not has_function_privilege('anon','private.initialize_verification_record()','EXECUTE'),'private SECURITY DEFINER helpers pin empty search_path and deny anon');
select has_trigger('auth','users','on_auth_user_created_verification_record','new Auth users receive a pending verification record');
select ok(not exists(select 1 from pg_policies where schemaname='private' and tablename='action_rate_limits'),'rate-limit table has no client policies');
select ok(not has_table_privilege('anon','private.action_rate_limits','SELECT') and not has_table_privilege('authenticated','private.action_rate_limits','SELECT'),'clients cannot read private rate-limit state');

select ok((select count(*)=7 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=any(array['block_user','discover_profiles','get_blocked_users','send_like','send_secret_crush','submit_report','unblock_user']) and p.prosecdef and coalesce(p.proconfig,array[]::text[]) @> array['search_path=""']),'exposed SECURITY DEFINER RPCs pin empty search_path');
select ok(not has_table_privilege('authenticated','public.reports','INSERT'),'clients cannot insert reports directly');
select ok(not has_function_privilege('anon','public.submit_report(uuid,text,text)','EXECUTE'),'anon cannot submit reports');
select ok(has_function_privilege('authenticated','public.submit_report(uuid,text,text)','EXECUTE'),'authenticated can submit reports through validated RPC');
select ok(not has_table_privilege('authenticated','public.blocks','INSERT'),'clients cannot forge block ownership');
select ok(not has_table_privilege('authenticated','public.blocks','DELETE'),'clients cannot bypass unblock validation');
select ok(not has_function_privilege('anon','public.block_user(uuid)','EXECUTE'),'anon cannot block accounts');
select ok(has_function_privilege('authenticated','public.block_user(uuid)','EXECUTE'),'authenticated can block through actor-bound RPC');
select ok(not has_function_privilege('anon','public.unblock_user(uuid)','EXECUTE'),'anon cannot unblock accounts');
select ok(has_function_privilege('authenticated','public.unblock_user(uuid)','EXECUTE'),'authenticated can unblock through actor-bound RPC');
select ok(not has_function_privilege('anon','public.get_blocked_users()','EXECUTE'),'anon cannot list blocked accounts');
select ok(has_function_privilege('authenticated','public.get_blocked_users()','EXECUTE'),'authenticated can list own blocked accounts');

select ok(not has_function_privilege('anon','public.get_public_feed(integer,timestamptz)','EXECUTE'),'anon cannot execute community feed');
select ok(has_function_privilege('authenticated','public.get_public_feed(integer,timestamptz)','EXECUTE'),'authenticated can call guarded community feed');
select ok(position('b.blocker_id=v_actorandb.blocked_id=p.author_id' in regexp_replace(lower(pg_get_functiondef('public.get_public_feed(integer,timestamptz)'::regprocedure)),'[[:space:]]+','','g'))>0 and position('b.blocked_id=v_actorandb.blocker_id=p.author_id' in regexp_replace(lower(pg_get_functiondef('public.get_public_feed(integer,timestamptz)'::regprocedure)),'[[:space:]]+','','g'))>0,'feed excludes post authors blocked in either direction');
select ok(position('b.blocker_id=v_actorandb.blocked_id=c.author_id' in regexp_replace(lower(pg_get_functiondef('public.get_public_feed(integer,timestamptz)'::regprocedure)),'[[:space:]]+','','g'))>0 and position('b.blocked_id=v_actorandb.blocker_id=c.author_id' in regexp_replace(lower(pg_get_functiondef('public.get_public_feed(integer,timestamptz)'::regprocedure)),'[[:space:]]+','','g'))>0,'feed comment counts exclude blocked commenters');

select has_column('private','verification_records','student_status','private verification records retain current UNESWA student status');
select has_column('private','verification_records','student_provider_ref','private verification records retain trusted student-provider reference');
select ok(not has_function_privilege('anon','public.get_my_student_verification_status()','EXECUTE'),'anon cannot read student verification status');
select ok(has_function_privilege('authenticated','public.get_my_student_verification_status()','EXECUTE'),'authenticated can read own student verification status');
select ok(position('own_verification.student_status' in lower(pg_get_functiondef('public.discover_profiles(text,integer)'::regprocedure)))>0 and position('vr.student_status' in lower(pg_get_functiondef('public.discover_profiles(text,integer)'::regprocedure)))>0,'discovery requires verified student status for caller and candidate');
select ok(position('vr.student_status' in lower(pg_get_functiondef('public.send_like(uuid)'::regprocedure)))>0,'likes require verified student status for both participants');
select ok(position('vr.student_status' in lower(pg_get_functiondef('public.send_secret_crush(uuid)'::regprocedure)))>0,'Secret Crush requires verified student status for both participants');
select ok(position('private.is_match_available' in lower(pg_get_functiondef('private.is_conversation_available(uuid)'::regprocedure)))>0,'conversation access delegates to match eligibility helper');
select ok(position('v.student_status' in lower(pg_get_functiondef('public.get_public_feed(integer,timestamptz)'::regprocedure)))>0,'community feed requires verified UNESWA student status');
select ok(position('v.student_status' in lower(pg_get_functiondef('public.get_post_comments(uuid)'::regprocedure)))>0,'community comment reads require verified UNESWA student status');
select ok(position('v.student_status' in lower(pg_get_functiondef('public.create_post_comment(uuid,text)'::regprocedure)))>0,'community comment creation requires verified UNESWA student status');


select ok(not has_function_privilege('anon','public.get_my_conversations()','EXECUTE'),'anon cannot list conversations');
select ok(has_function_privilege('authenticated','public.get_my_conversations()','EXECUTE'),'authenticated can list guarded conversations');
select ok((select p.prosecdef and coalesce(p.proconfig,array[]::text[]) @> array['search_path=""'] from pg_proc p where p.oid='public.get_my_conversations()'::regprocedure),'conversation list RPC is SECURITY DEFINER with empty search_path');
select ok(position('private.is_conversation_available' in lower(pg_get_functiondef('public.get_my_conversations()'::regprocedure)))>0,'conversation list applies the shared eligibility guard');

select ok(not has_function_privilege('anon','public.send_message(uuid,text)','EXECUTE'),'anon cannot send messages');
select ok(has_function_privilege('authenticated','public.send_message(uuid,text)','EXECUTE'),'authenticated can call guarded message RPC');
select ok((select p.prosecdef and coalesce(p.proconfig,array[]::text[]) @> array['search_path=""'] from pg_proc p where p.oid='public.send_message(uuid,text)'::regprocedure),'message RPC is SECURITY DEFINER with empty search_path');
select ok(position('private.is_conversation_available' in lower(pg_get_functiondef('public.send_message(uuid,text)'::regprocedure)))>0,'message sending applies the shared eligibility guard');


select ok((select p.prosecdef and coalesce(p.proconfig,array[]::text[]) @> array['search_path=""'] from pg_proc p where p.oid='private.is_match_available(uuid)'::regprocedure) and not has_function_privilege('anon','private.is_match_available(uuid)','EXECUTE') and has_function_privilege('authenticated','private.is_match_available(uuid)','EXECUTE'),'match eligibility helper is restricted and pins empty search_path');
select ok(position('own_v.age_status' in lower(pg_get_functiondef('private.is_match_available(uuid)'::regprocedure)))>0 and position('own_v.student_status' in lower(pg_get_functiondef('private.is_match_available(uuid)'::regprocedure)))>0 and position('peer_v.age_status' in lower(pg_get_functiondef('private.is_match_available(uuid)'::regprocedure)))>0 and position('peer_v.student_status' in lower(pg_get_functiondef('private.is_match_available(uuid)'::regprocedure)))>0 and position('b.blocker_id = m.user_low' in lower(pg_get_functiondef('private.is_match_available(uuid)'::regprocedure)))>0 and position('b.blocker_id = m.user_high' in lower(pg_get_functiondef('private.is_match_available(uuid)'::regprocedure)))>0,'match eligibility helper checks both participants and both block directions');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='matches' and policyname='matches_select_verified_unblocked_participant' and qual ilike '%private.is_match_available%'),'match table reads use the eligibility helper');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='conversations' and policyname='conversations_select_verified_unblocked_participant' and qual ilike '%private.is_conversation_available%'),'conversation table reads use the eligibility helper');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='messages' and policyname='messages_select_age_verified_unblocked_match' and qual ilike '%private.is_conversation_available%'),'message table reads use the conversation eligibility helper');
select ok((select p.prosecdef and coalesce(p.proconfig,array[]::text[]) @> array['search_path=""'] from pg_proc p where p.oid='private.is_conversation_available(uuid)'::regprocedure) and not has_function_privilege('anon','private.is_conversation_available(uuid)','EXECUTE') and has_function_privilege('authenticated','private.is_conversation_available(uuid)','EXECUTE'),'conversation eligibility helper is restricted and pins empty search_path');

select ok(position('post_v.student_status' in lower(pg_get_functiondef('public.get_public_feed(integer,timestamptz)'::regprocedure)))>0,'feed hides posts from authors without current UNESWA verification');
select ok(position('comment_v.student_status' in lower(pg_get_functiondef('public.get_public_feed(integer,timestamptz)'::regprocedure)))>0,'feed comment counts exclude authors without current UNESWA verification');
select ok(position('post_v.student_status' in lower(pg_get_functiondef('public.get_post_comments(uuid)'::regprocedure)))>0 and position('comment_v.student_status' in lower(pg_get_functiondef('public.get_post_comments(uuid)'::regprocedure)))>0,'comment reads require both post and comment authors to remain eligible');
select ok(position('post_v.student_status' in lower(pg_get_functiondef('public.create_post_comment(uuid,text)'::regprocedure)))>0,'comment creation rejects posts whose authors are no longer eligible');

select * from finish();
rollback;
