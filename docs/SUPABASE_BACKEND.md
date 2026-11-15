# CRUSH Supabase backend

Updated 15 November 2026.

## Supabase project

- Project: CRUSH
- Project reference: dtlbpkcaojctamelogbv
- Region: eu-west-1 (Europe West)
- Project URL: https://dtlbpkcaojctamelogbv.supabase.co

The mobile client uses the Supabase publishable key only. Never place a secret key, legacy service-role key, database password, or vendor secret in Expo public variables or Git.

## Database foundation

Hosted migrations create:
- University of Eswatini and Kwaluseni campus seed records.
- Profiles linked to Supabase Auth users.
- Likes, Secret Crush, matches, conversations and messages.
- Blocks and user-submitted reports.
- Private age/student verification status records.
- A private profile-photos Storage bucket, limited to JPEG, PNG and WebP up to 5 MB.
- Row Level Security on application tables and verification records.
- Realtime publication membership for messages.
- Private per-user rate-limit counters and server-authorized discovery/matching RPCs.

Migration files (filenames match the versions already recorded in the hosted Supabase migration history):
- supabase/migrations/20261114175834_initial_crush_core.sql
- supabase/migrations/20261114175851_realtime_messages_and_indexes.sql
- supabase/migrations/20261114180414_lock_profiles_until_verified.sql
- supabase/migrations/20261114180508_deny_client_verification_access.sql
- supabase/migrations/20261114181907_hide_block_relationships.sql
- supabase/migrations/20261114185202_verified_discovery_and_matching.sql
- supabase/migrations/20261114185342_initialize_verification_status.sql
- supabase/migrations/20261114190636_require_visible_discovery_caller.sql
- supabase/migrations/20261114191122_secure_report_submission.sql
- supabase/migrations/20261114191649_secure_block_controls.sql

An Auth trigger creates a private pending/pending verification record automatically for every new account and backfills existing Auth users. Clients cannot write or promote these statuses. The hosted migrations are applied, and all 10 tracked migration filenames now exactly match the version/name history recorded by the hosted project. This prevents a later Supabase CLI push from treating already-applied migrations as new. Live catalog checks confirm RLS on all 10 public application tables and on private verification/rate-limit tables; the profile-photo bucket is private; direct client INSERT privileges on likes and Secret Crush are absent; and messages are in the Realtime publication.

### Current Supabase Advisor results — 15 November 2026

The live Security Advisor reports:
- **1 INFO:** private.action_rate_limits has RLS enabled and no policies. This is intentional default-deny protection; the table has no anon/authenticated SELECT grants and the private rate-limit helper is not executable by API roles.
- **7 WARN:** the seven public RPCs (block_user, discover_profiles, get_blocked_users, send_like, send_secret_crush, submit_report and unblock_user) are SECURITY DEFINER and executable by authenticated users. This is the intended application interface because these functions enforce actor-bound checks and perform writes that mobile clients cannot perform directly. A targeted review confirms each sets an empty search_path, uses fully qualified object references, derives the actor from auth.uid(), and denies anon EXECUTE. These generic warnings must remain visible and be re-reviewed whenever an RPC changes.
- The two private SECURITY DEFINER helpers (consume_action_rate_limit and initialize_verification_record) also set an empty search_path and have no anon/authenticated EXECUTE grants. The rate-limit helper is called internally by the guarded public RPCs; the verification initializer is trigger-only.
- **10 performance INFO notices:** indexes are unused so far because the project has negligible traffic. Do not drop them without representative query plans and workload measurements.

Unauthenticated smoke tests for discovery, like and Secret Crush reject calls. Read-only catalog checks confirm empty search_path on all nine SECURITY DEFINER functions, no anon EXECUTE on the seven public RPCs, no client EXECUTE on either private helper, and no client SELECT on private rate-limit state. These checks do not replace authenticated two-account or adversarial behavior tests.

## Mobile authentication implementation

The Expo app includes:
- Pinned @supabase/supabase-js v2.119.0 and React Native URL polyfill v4.0.0.
- Expo SecureStore-backed session persistence, split into small encrypted chunks to accommodate platform storage limits.
- PKCE auth flow, automatic token refresh while the app is foregrounded, and auth-state routing.
- Email/password registration and sign-in.
- Email confirmation callback.
- Password recovery and password update callback.
- Automatic creation of a private, hidden profile after the user obtains a session.
- A pending-access screen. Signing in does not grant dating/discovery access.

AuthContext now prevents a late getSession() result from overwriting a newer auth-state event. The session store is not yet validated on physical Android and iOS devices. Web sign-in is deliberately disabled until a cookie-backed web session architecture is implemented. A failure to store the native session should be treated as a sign-in failure and tested before launch.

## Discovery and matching RPCs

The hosted database contains these authenticated RPCs:
- discover_profiles(p_mode, p_limit): returns only limited safe profile fields for other visible accounts whose age and student statuses are both verified. It excludes the caller, blocked relationships and existing matches. It is rate-limited to 30 calls/minute.
- send_like(p_recipient_id): inserts a like server-side after checking both users are visible, verified for age and student status, dating-enabled and unblocked. It creates a match and conversation only when the recipient has already liked the caller. Limit: 100/day.
- send_secret_crush(p_recipient_id): applies the same eligibility/block rules, but stores Secret Crush privately. It creates a match and conversation only after reciprocal Secret Crush. Limit: 10/day.
- submit_report(p_target_user_id, p_category, p_details): derives the reporter from auth.uid(), validates target/category/details, rate-limits submissions, and always creates a pending report. Direct client report INSERT is revoked.
- block_user(p_blocked_user_id) and unblock_user(p_blocked_user_id): derive the actor from auth.uid() and enforce ownership server-side. Direct client block INSERT/DELETE is revoked.
- get_blocked_users(): returns only the caller's blocked-account list.

Clients cannot read Secret Crush rows or create matches/conversations directly. RPC responses disclose only whether a mutual match occurred and its match ID. The app currently has no age/student verification process that can legitimately mark a user verified, so these functions are intentionally fail-closed and discovery remains empty until an approved trusted verification workflow exists.

The Discovery screen calls the discovery, like, Secret Crush, report and block RPCs. Friends mode is browse-only until a separate friend-request workflow is implemented. Pass remains session-only; permanent pass history and a complete friend-request workflow are not yet implemented.

## Required Supabase Dashboard configuration

### 1. Data API schema exposure

The project was created after Supabase's 30 October 2026 change that stopped automatically exposing new public tables through the Data API. Do not assume that RLS or SQL grants automatically expose the schema.

In Project Settings → API → Data API settings, verify that the public schema is exposed because this Expo client uses supabase-js and the Data API. Keep the exposed schema list minimal. All exposed application tables must retain RLS and least-privilege grants. Do not expose the private schema or verification records. If the public schema is not exposed, Auth may still work while profile/database requests fail.

### 2. Authentication redirect URLs

Open Authentication → URL Configuration:
1. Keep the Site URL set to a safe HTTPS website you control (or the dashboard's temporary default while testing).
2. Add these exact values under Additional Redirect URLs:
   - crush://auth/confirmed
   - crush://auth/reset-password
3. Save the settings.

### 3. Email provider

Open Authentication → Providers → Email and confirm email/password sign-up is enabled and email confirmation is required. Do not disable confirmation for production.

Supabase's default email sender is rate-limited and is not suitable for a public launch. Configure a production SMTP provider, sender domain, SPF/DKIM/DMARC and delivery monitoring before inviting users. The app should be tested with real devices and email addresses you control.

## Environment

Copy .env.example to .env for local development. The example includes the public project URL and publishable key. The .env file is ignored by Git.

The Android GitHub Actions workflow also injects those same public client values so its test APK can reach this project. A publishable key is intended to be present in a mobile binary; database security depends on RLS and server-side authorization, not key secrecy.

## Important security boundaries

- Profiles are readable only by their owner through direct table access. Discovery uses the constrained RPC, not broad table SELECT.
- Profiles can only be created or updated with visibility = hidden through the client. A trusted server must explicitly approve and publish a profile after age and student verification.
- Direct client inserts into likes and Secret Crush are revoked. Only the constrained RPCs can create them.
- Clients cannot create matches or conversations. The RPCs create them only after mutual intent and eligibility checks.
- Secret-crush rows are not readable by mobile clients. Sender identities are not disclosed before reciprocal Secret Crush.
- Messages are limited to active match participants, and both directions of a block prevent access.
- Verification records and rate-limit counters are in the private schema, inaccessible to anon/authenticated API roles.
- The app is not production-ready. Age assurance, UNESWA student verification, moderation, admin tools, data export/deletion and complete authenticated security tests remain outstanding.

## Remaining implementation

1. Verify public Data API exposure without exposing the private schema.
2. Complete Supabase Auth redirect and email provider configuration in the dashboard.
3. Finish the Android PR build and TypeScript checks; resolve any failures.
4. Finish mobile UI testing for discovery, likes and Secret Crush; add permanent pass history and the separate friend-request workflow.
5. Select and integrate trusted age assurance and a University-approved UNESWA student verification workflow. Accounts must remain hidden and ineligible until both checks are verified.
6. Add moderator workflows, audit trail, account deletion/export and retention controls.
7. Run authenticated two-account tests for reciprocal/non-reciprocal likes, Secret Crush privacy, block in both directions, unmatch, session revocation and rate limits.
8. Add realtime messaging only after match and block authorization tests pass.
9. Complete penetration-style RLS/API tests, backups, alerts and the production launch review.
