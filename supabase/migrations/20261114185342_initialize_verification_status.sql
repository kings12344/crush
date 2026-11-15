-- Every new Auth account receives a private, pending verification record.
-- No client can write this table or promote either status to verified.

create or replace function private.initialize_verification_record()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into private.verification_records (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function private.initialize_verification_record() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_verification_record on auth.users;
create trigger on_auth_user_created_verification_record
after insert on auth.users
for each row execute function private.initialize_verification_record();

-- Backfill any accounts that existed before this trigger was installed.
insert into private.verification_records (user_id)
select u.id from auth.users u
on conflict (user_id) do nothing;
