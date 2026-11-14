alter table private.verification_records enable row level security;

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert to authenticated
with check ((select auth.uid()) = id and visibility = 'hidden');

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id and visibility = 'hidden');

revoke insert on public.likes from authenticated;
revoke insert on public.secret_crushes from authenticated;
