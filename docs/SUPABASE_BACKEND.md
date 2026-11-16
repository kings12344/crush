# CRUSH Supabase backend

Updated 17 November 2026 after the eligibility-model correction.

## Project and cost baseline

- Project: CRUSH
- Project reference: `dtlbpkcaojctamelogbv`
- Region: `eu-west-1` (Europe West)
- Database: PostgreSQL 17.11
- Supabase organization plan: Free
- No Auth users or application profiles existed at the last live inspection.
- No billing-plan upgrade, new project, paid add-on or provider account was created.

The mobile client uses the Supabase publishable key only. Never place a secret key, legacy service-role key, database password, SMTP credential or vendor secret in Expo public variables or Git.

## Database schema and migration state

The hosted project currently records these 15 migrations:

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

The live `private.verification_records` table currently has no student-status columns because the previous age-only migrations removed them. This is the deployed state, not the corrected target state. The hosted project has 12 public application tables with RLS enabled, and private verification/rate-limit tables have no direct client table access.

Two follow-up migrations on the feature branch are not applied to the hosted project:
- `20261116000000_block_aware_community_feed` — excludes post authors and commenters blocked in either direction.
- `20261117000000_restore_uneswa_student_eligibility` — additively restores private student-status fields and re-enforces both eligibility checks across protected RPCs.

The restoration migration does not delete user data or grant client access to the private verification table. Neither pending migration was applied in this pass.

## Eligibility model

CRUSH is exclusively for current University of Eswatini (UNESWA) students aged 18 and above.

- Every Auth user receives private pending verification statuses by default.
- `public.get_my_age_verification_status()` returns only the signed-in user's age status.
- `public.get_my_student_verification_status()` returns only the signed-in user's student status.
- Both status RPCs are authenticated and expose no provider evidence or another user's data.
- The mobile app checks both RPCs after sign-in and whenever it returns to the foreground.
- The app fails closed if either RPC/network request fails or either status is pending, rejected, needs review or unavailable.
- Discovery and matching require both the caller and candidate to have age and student statuses verified, with profile visibility and preferences enabled and no block in either direction.
- Messaging requires an active mutual match, both participants verified for age and student status, and no block in either direction. The shared private conversation guard protects conversation listing, message reads and message sends.
- Community feed/comment reads and comment creation require an authenticated account verified for both requirements. The block-aware feed hides blocked authors and comments.
- Report and block controls remain available as safety operations while an account is pending verification.

No trusted age-assurance provider or University-approved student-verification process is connected yet. New accounts must remain pending. Never manually set a status to verified or accept a client-supplied verified flag to bypass the missing integrations.

## Messaging and community

- `get_my_conversations()` lists only the caller's eligible, unblocked mutual-match conversations.
- `send_message(conversation_id, body)` derives the sender from `auth.uid()`, checks the active match and both verification statuses, validates message length and applies a rate limit.
- Direct client message INSERT is revoked; message reads are protected by RLS and the private conversation guard.
- Community posts/comments have RLS enabled with no direct client table grants or policies. Narrow RPCs expose only published content and visible comments after both eligibility checks.
- Unmatched Secret Crush identities remain private; client table access is not granted.

## Live verification performed

- Confirmed the 15 hosted migration versions/names and the live absence of `student_status` and `student_provider_ref` columns.
- Confirmed all 12 public application tables have RLS enabled.
- Confirmed private verification and rate-limit records have no direct client table access.
- Confirmed inspected SECURITY DEFINER functions use an empty `search_path`; no inspected function is executable by `anon`.
- Confirmed the profile-photo bucket is private, limited to 5 MiB and JPEG/PNG/WebP.
- Confirmed the hosted project currently has zero Auth users and zero profiles. No real-user or two-account behavior test has been completed.

The follow-up migration and expanded pgTAP assertions are committed on the feature branch but have not been applied or executed against the hosted database. A separate test database/branch is required for full SQL and two-account behavioral validation.

## Advisor results — 15 November 2026

- **3 INFO notices:** RLS-enabled tables without policies: private rate-limit state and the two community tables. This is intentional default-deny; direct client table grants are absent and access is through narrow server-side RPCs.
- **13 WARN notices:** authenticated execution of SECURITY DEFINER RPCs. These are intended server-side operations; empty `search_path` and actor-bound checks must remain, with behavioral tests for every changed RPC.
- **12 performance INFO notices:** currently unused indexes on a near-zero-traffic project. Retain until representative query plans justify changes.
- No health advisor findings were returned.

## Dashboard configuration still to verify

1. Confirm the Data API exposes only the required `public` schema and does not expose `private`.
2. In Authentication → URL Configuration, allowlist `crush://auth/confirmed` and `crush://auth/reset-password`.
3. Keep email confirmation enabled.
4. Configure production SMTP, sender domain, SPF/DKIM/DMARC and delivery monitoring before public use.
5. Confirm backup/restore behavior and retention before storing real user data.

No dashboard Auth/SMTP setting was changed because the connected Supabase actions do not expose those controls.

## Remaining production blockers

- Integrate trusted age assurance and University-approved current-student verification with signed server-to-server result validation and a privacy/retention review.
- Review both pending migrations in a test database, run pgTAP and two-account adversarial tests, then obtain required approval before applying production migrations.
- Confirm dashboard Data API exposure, Auth redirect allowlist and production SMTP.
- Run physical Android/iOS tests for signup, confirmation, SecureStore persistence, recovery, logout, foreground refresh and messaging.
- Complete moderator queue/staff roles/audit trail, account deletion/export and retention jobs.
- Complete mobile/API security review, backup/restore drill, monitoring/alerts, incident response, privacy/legal review and production signing.

Do not invite public users or distribute a production release until these gates pass. The system intentionally remains fail-closed while both trusted verification integrations are missing.
