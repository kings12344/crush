# CRUSH implementation roadmap

This roadmap tracks the transition from a frontend prototype to a secure campus social-discovery app. No stage is complete until code, configuration, and relevant tests demonstrate the outcome.

## Stage 1 — Trusted core

Selected backend: Supabase Auth, PostgreSQL, private Storage, Realtime and Edge Functions. The Expo/React Native client uses Supabase JS.

Implemented and deployed:
- Auth email/password signup, sign-in, email confirmation and password recovery/reset on the feature branch.
- PKCE and OS-backed SecureStore native session persistence.
- Owner-only hidden profile creation after authentication.
- App-level navigation guard keeps authenticated but unverified sessions on the pending-access screen and blocks direct navigation into prototype tabs; email confirmation and password-reset callbacks remain reachable.
- University of Eswatini and Kwaluseni campus seed data.
- RLS on public application tables and private verification records.
- Client direct inserts to likes and Secret Crush revoked.
- An Auth trigger automatically creates private pending verification records for new users and backfills existing accounts.
- Authenticated, rate-limited discovery, like and Secret Crush RPCs with mutual-match and conversation creation. Both caller and candidates must have verified age and student status, visible profiles, relevant preference enabled and no block in either direction. A follow-up migration now enforces the caller's own visibility and selected mode inside the discovery RPC, not just in client navigation.
- SecureStore session manifests validate generated IDs and bound chunk counts to 100 on read, write and cleanup, preventing malformed metadata from triggering unbounded cleanup work.
- User report submission now goes through an authenticated, rate-limited `submit_report` RPC. Direct client INSERT on `public.reports` is revoked; the RPC derives the reporter from `auth.uid()`, validates category/target/details, and always creates a `pending` report. Live catalog checks confirm authenticated direct INSERT is denied, authenticated RPC execution is allowed, and anon RPC execution is denied.
- Unauthenticated RPC smoke tests fail closed. Direct Supabase catalog checks currently pass 15/15 against the deployed project; the project has no Auth users yet, so authenticated two-account behavior cannot be exercised without test accounts.
- Added `supabase/tests/verification_and_discovery.test.sql` with pgTAP catalog checks for RLS, private-schema boundaries, trigger installation and RPC execute grants. This test file is committed but has not yet been run in CI or a local Supabase test stack.

Still required:
- Complete Auth redirect allowlist and email delivery configuration.
- Physical-device signup, email confirmation, session persistence, password recovery and logout tests.
- Discovery UI is connected to live discovery, like and Secret Crush RPCs; Friends mode is browse-only until friend requests are implemented.
- Select and implement a trusted 18+ age-assurance provider.
- Establish a University-approved UNESWA student verification process.
- Add moderator review, unmatch, account deletion/export and retention controls.
- Authenticated two-account integration tests for mutual and non-mutual actions, Secret Crush non-disclosure, block bypass, match revocation and rate limits.
- Realtime messaging only after those authorization tests pass.

Until an age provider or University-approved process is selected and connected, accounts must remain pending and profiles hidden. Never turn a client DOB field, email domain or demo flag into verified status.

## Stage 2 — Media and moderation

Add private image/video upload sessions, ownership-bound media metadata, playback authorization, video processing states, comments and interactions. Add report intake, a private moderator queue, least-privilege review actions, audit history, appeals/escalation status, and server-side block/suspend enforcement. Do not publish user media until required moderation gates pass. Vendor classification may inform review but cannot be the only enforcement decision.

## Stage 3 — Notifications, calls, and events

Add device-token registration and revocation, generic privacy-safe push payloads, in-app notifications, delivery retries/receipts, campus events, registrations and cancellation rules. Add one-to-one call invitations and call state with short-lived provider tokens issued only after rechecking eligibility, active match and both block directions. Calls are not recorded by default.

## Stage 4 — Admin, account rights, and payments

Add a separate staff/admin surface with strict role separation, least-privilege scopes and audit logs. Implement account deletion, data export, retention/deletion jobs, consent records and privacy-safe operational monitoring. Add premium entitlements and payment lifecycle only after a payment provider confirms Eswatini merchant onboarding and settlement, and after app-store billing requirements for digital benefits have been resolved. Never activate charges in a prototype.

## Stage 5 — Release readiness

Resolve the known dependency audit findings through a planned SDK-compatible update rather than npm audit fix --force. Validate iOS/Android builds and device-only paths, backend security controls, database migrations/backups, secrets handling, operational alerts, abuse response, accessibility, privacy review and the full launch gate in SECURITY.md. Deployment and production credentials remain operator-owned and must not be committed to Git.

Progress as of 2026-11-14: Supabase project and schema are deployed in EU West. Supabase JS, React Native URL polyfill and Expo SecureStore are pinned; the dependency lockfile has been regenerated. Registration, login, email-confirmation and password-recovery code is integrated in the feature branch. Discovery, like and Secret Crush RPCs have been deployed and committed as a migration; the Discovery UI calls them. A new-user trigger creates private pending verification status. Unauthenticated smoke tests passed. Added database catalog tests, pending execution. Supabase Advisor flags the three intentionally exposed SECURITY DEFINER RPCs for review and the private rate-limit table as default-deny; see SUPABASE_BACKEND.md. Android workflow TypeScript and native project generation previously passed on an earlier run; subsequent runs were cancelled by newer commits. The latest run for the current branch head is queued, so the current SecureStore change still needs CI verification and no APK artifact is available yet. Physical-device auth testing, trusted age/student verification, physical-device UI tests and authenticated two-account security tests remain incomplete. The dependency audit still reports 3 moderate findings.

## Provider direction and gates

Supabase is the selected backend and authentication platform. The prior NestJS + Clerk direction is superseded. Provider choices for age assurance, UNESWA student verification, email SMTP, media, calls and moderation remain conditional and are documented in PROVIDER_DECISIONS.md.

Didit is only an age/document-verification candidate, not student verification. SheerID's UNESWA coverage is unconfirmed; until confirmed, student review needs a University-approved manual process. Expo Push Service is the initial notification candidate. Cloudinary is a media candidate if authenticated delivery and Expo native-build compatibility are validated. Daily is a call candidate after a device/network pilot. Hive is a moderation candidate after account and Dashboard access are confirmed. Payment provider availability is unresolved.

Vendor selection does not establish Eswatini onboarding, legal compliance or production readiness. Live integrations require vendor confirmation, user-owned accounts, credentials stored only in server-side secret management, written terms/retention review and end-to-end device tests.
