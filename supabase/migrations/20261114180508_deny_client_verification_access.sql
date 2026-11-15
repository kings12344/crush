create policy verification_records_deny_client_access
on private.verification_records
for all
to anon, authenticated
using (false)
with check (false);
