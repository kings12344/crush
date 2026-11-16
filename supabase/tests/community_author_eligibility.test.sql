-- Behavioral regression tests for community content after age/student status changes.
-- These synthetic users and posts exist only inside this rolled-back local test.
begin;
select plan(9);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'authenticated','authenticated','feed-author-a@example.test','test-only',
  now(),'{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Eligible A"}'::jsonb,now(),now()
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'authenticated','authenticated','feed-author-b@example.test','test-only',
  now(),'{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Pending B"}'::jsonb,now(),now()
);

insert into public.profiles (id,display_name,visibility,dating_enabled,friendship_enabled)
values
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Eligible A','visible',true,true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Pending B','visible',true,true);

update private.verification_records
set age_status='verified', student_status='verified'
where user_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

update private.verification_records
set age_status='verified', student_status='pending'
where user_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

insert into public.community_posts (id,author_id,body,status)
values
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Eligible author post','published'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Pending author post','published');

insert into public.community_comments (id,post_id,author_id,body,status)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Comment from pending student',
  'visible'
);

select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',true);
select set_config('request.jwt.claims','{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}',true);

select is(
  (select count(*) from public.get_public_feed(20,null) where post_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01'),
  0::bigint,
  'feed hides posts authored by a non-verified student'
);
select is(
  (select comment_count from public.get_public_feed(20,null) where post_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'),
  0::bigint,
  'feed count excludes comments by a non-verified student'
);
select is(
  (select count(*) from public.get_post_comments('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01')),
  0::bigint,
  'comment list hides comments by a non-verified student'
);
select is(
  (select count(*) from public.get_post_comments('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01')),
  0::bigint,
  'comment list hides posts whose author is not eligible'
);
select throws_ok(
  $$select public.create_post_comment('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01','Cannot comment')$$,
  '22023',
  null,
  'comment creation rejects a post by a non-verified student'
);

update private.verification_records
set student_status='verified'
where user_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

select is(
  (select count(*) from public.get_public_feed(20,null) where post_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01'),
  1::bigint,
  'feed shows the post after its author is verified'
);
select is(
  (select count(*) from public.get_post_comments('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01')),
  1::bigint,
  'comment becomes visible after its author is verified'
);
select lives_ok(
  $$select public.create_post_comment('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01','Eligible comment')$$,
  'eligible student can comment on an eligible post'
);
select is(
  (select count(*) from public.get_post_comments('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01')),
  1::bigint,
  'new comment is visible after eligibility checks pass'
);

select * from finish();
rollback;
