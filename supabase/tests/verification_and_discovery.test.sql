-- Run with: supabase test db
-- These catalog-level checks verify the deployed authorization boundary.
-- Two-account behavioral tests are still required before enabling production discovery.

begin;

select plan(15);

select has_table('private', 'verification_records',
  'verification records are stored outside the exposed public schema');
select has_table('private', 'action_rate_limits',
  'rate-limit state is stored in the private schema');

select ok((select c.relrowsecurity from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'profiles'),
  'profiles has row-level security enabled');

select ok((select c.relrowsecurity from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'private' and c.relname = 'verification_records'),
  'verification records have row-level security enabled');

select ok((select c.relrowsecurity from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'private' and c.relname = 'action_rate_limits'),
  'rate-limit state has row-level security enabled');

select ok(not has_function_privilege('anon',
  'public.discover_profiles(text,integer)', 'EXECUTE'),
  'anonymous users cannot execute discovery');
select ok(has_function_privilege('authenticated',
  'public.discover_profiles(text,integer)', 'EXECUTE'),
  'signed-in users can execute the guarded discovery RPC');

select ok(not has_function_privilege('anon',
  'public.send_like(uuid)', 'EXECUTE'),
  'anonymous users cannot send likes');
select ok(has_function_privilege('authenticated',
  'public.send_like(uuid)', 'EXECUTE'),
  'signed-in users can call the guarded like RPC');

select ok(not has_function_privilege('anon',
  'public.send_secret_crush(uuid)', 'EXECUTE'),
  'anonymous users cannot send Secret Crush');
select ok(has_function_privilege('authenticated',
  'public.send_secret_crush(uuid)', 'EXECUTE'),
  'signed-in users can call the guarded Secret Crush RPC');

select ok(not has_function_privilege('authenticated',
  'private.consume_action_rate_limit(text,integer,interval)', 'EXECUTE'),
  'clients cannot invoke the private rate-limit helper');

select ok(not has_function_privilege('authenticated',
  'private.initialize_verification_record()', 'EXECUTE'),
  'clients cannot invoke the Auth verification trigger function');

select has_trigger('auth', 'users',
  'on_auth_user_created_verification_record',
  'new Auth users receive a pending verification record');

select ok(not exists (
  select 1 from pg_policies
  where schemaname = 'private'
    and tablename = 'action_rate_limits'
), 'rate-limit table has no client policies (intentional default deny)');

select * from finish();
rollback;
