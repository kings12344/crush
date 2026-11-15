# CRUSH Supabase backend

Updated 15 November 2026 after the production-readiness pass.

## Project and cost baseline

- Project: CRUSH
- Project reference: `dtlbpkcaojctamelogbv`
- Region: `eu-west-1` (Europe West)
- Database: PostgreSQL 17.11
- Supabase organization plan: Free
- Project status: ACTIVE_HEALTHY
- No Auth users or application profiles existed at the time of this review.
- No billing-plan upgrade, new project, paid add-on or provider account was created.

The mobile client uses the Supabase publishable key only. Never place a secret key, legacy service-role key, database password, SMTP credential or vendor secret in Expo public variables or Git.

## Database schema and migrations

The hosted project records 15 migrations:

1. `20261114175834_initial_crush_core`
2. `20261114175851_realtime_messages_and_indexes`
3. `20261114180414_lock_profiles_until_verified`
4. `20261114180508_deny_client_verification_access`
5. `20261114181907_hide_block_relationships`
6. `20261114185202_verified_discovery_and_matching`
7. `20261114185342_initialize_verification_status`
8. `20261114190636_require_visible_discovery_caller`
9. `20261114191122_secure_report_submission`
10. `20261114191649_secure_block_controls`
11. `20261115081150_public_community_feed_and_comments`
12. `20261115113736_secure_match_messaging_and_chat_rpc`
13. `20261115113749_remove_uneswa_student_verification`
14. `20261115113758_age_gate_community_reads_and_status_rpc`
15. `20261115114600_remove_legacy_student_verification_columns`

The live database currently has 12 public application tables. RLS is enabled on all of them. Private verification records and rate-limit state are in the `private` schema; client roles have no direct table grants to those records. The Data API's exposed-schema list still needs dashboard confirmation. The profile-photo bucket is private and limited to JPEG, PNG and WebP files up to 5 MiB. Realtime is enabled for messages.

### Age-only eligibility

UNESWA student verification has been removed from the app's eligibility checks and from the live discovery, like, Secret Crush, messaging and community-comment authorization functions. The obsolete `student_status` and `student_provider_ref` columns have been removed from the private verification record. No student-verification fields or eligibility checks remain.

Trusted 18+ age assurance remains mandatory:

- A new Auth user receives a private pending age status.
- `public.get_my_age_verification_status()` returns only the signed-in user's age status; it exposes no evidence or other account data.
- The app checks that RPC after sign-in and when returning to the foreground.
- The app fails closed on RPC/network errors and keeps every tab locked until the server returns `verified`.
- Discovery and matching RPCs require both accounts to be age-verified, visible, correctly opted in and unblocked.
- Messaging requires an active mutual match, both participants age-verified, and no block in either direction.
- Community feed and comment reads require an authenticated age-verified user. Anonymous execution has been revoked.
- No trusted age-verification provider or server callback is connected yet. Do not manually set a user's status to verified to bypass this missing integration.

### Messaging and community

- `get_my_conversations()` lists only the caller's available mutual-match conversations.
- `send_message(conversation_id, body)` derives the sender from `auth.uid()`, checks the active match and block state, validates message length, and applies a rate limit.
- Direct client message INSERT is revoked; message reads are protected by RLS and the private conversation guard.
- Community posts/comments have RLS enabled with no direct client table grants or policies. Narrow RPCs expose only published content and visible comments after age checks.
- Unmatched Secret Crush identities remain private; client table access is not granted.

## Live verification performed

- Confirmed the 14 hosted migration versions/names.
- Confirmed the chat RPCs and age-status RPC exist.
- Confirmed `anon` cannot execute the community feed or comment-read RPCs; authenticated role can execute them.
- Confirmed `anon` and `authenticated` cannot directly SELECT the private verification records or community-post tables.
- Confirmed every inspected SECURITY DEFINER function uses an empty `search_path`; no SECURITY DEFINER function is executable by `anon`.
- Confirmed no current SECURITY DEFINER function references `student_status`.
- Confirmed the photo bucket is private, has a 5 MiB limit, and allows JPEG/PNG/WebP.
- Confirmed there are currently zero Auth users and zero profiles. Therefore no real-user or two-account behavior test has been completed.

## Advisor results — 15 November 2026

- **3 INFO notices:** RLS-enabled tables without policies: private rate-limit state and the two community tables. This is intentional default-deny; direct client grants are absent and access is through narrow server-side RPCs. Do not add permissive policies to silence the notices.
- **13 WARN notices:** authenticated execution of SECURITY DEFINER RPCs. These are the intended server-side application operations. The functions use an empty search path and actor-bound checks; the warning is not proof of safety, so preserve code review and adversarial tests.
- **12 performance INFO notices:** currently unused indexes. The database has negligible traffic; retain indexes until representative query plans justify a change.
- No health advisor findings were returned.

## Dashboard configuration still to verify

1. Confirm the Data API exposes only the required `public` schema and does not expose `private`.
2. In Authentication → URL Configuration, allowlist:
   - `crush://auth/confirmed`
   - `crush://auth/reset-password`
3. Keep email confirmation enabled.
4. Configure a production SMTP sender, sender domain, SPF/DKIM/DMARC and delivery monitoring. Supabase's default sender is for testing, not public launch.
5. Confirm backup/restore behavior and retention for the current Free plan before storing real user data.

No dashboard Auth/SMTP setting was changed in this pass because the connected Supabase actions do not expose those controls.

## Remaining production blockers

- Select and integrate a trusted 18+ age-assurance provider with signed server-to-server result verification and a privacy/retention review.
- Confirm dashboard Data API exposure, redirect URLs and production SMTP.
- Run physical Android/iOS tests for signup, confirmation, SecureStore persistence, recovery, logout and messaging.
- Create controlled test accounts and run two-account authorization tests for discovery, reciprocal likes, Secret Crush non-disclosure, match messaging, block revocation, comment access and rate limits.
- Complete moderator queue/staff roles/audit trail, account deletion/export and retention jobs.
- Complete mobile/API security review, backups/restore drill, monitoring/alerts, incident response, privacy/legal review and production signing.

Do not invite public users or distribute a production release until these gates pass. The current system intentionally remains fail-closed while trusted age assurance is not connected.
