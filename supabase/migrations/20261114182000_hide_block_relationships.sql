-- A block is private to the person who created it.
-- The blocked account must not be able to enumerate who blocked them.
drop policy if exists blocks_select_involved on public.blocks;

create policy blocks_select_own
on public.blocks
for select
to authenticated
using ((select auth.uid()) = blocker_id);
