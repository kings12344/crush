# CRUSH implementation roadmap

Updated 15 November 2026. CRUSH is an adults-only social-discovery application. Trusted 18+ age assurance is mandatory. University enrollment verification is not an eligibility requirement.

## Stage 1 — Trusted core

### Implemented and deployed
- Supabase Auth email/password registration, sign-in, email confirmation and recovery/reset callbacks.
- PKCE and native SecureStore-backed session persistence.
- Owner-only hidden profile creation after authentication.
- RLS on all 12 public application tables; private verification and rate-limit state remain inaccessible to client roles.
- Private profile-photo bucket with JPEG/PNG/WebP allowlist and 5 MiB limit.
- Authenticated, rate-limited discovery, like, Secret Crush, block and report RPCs.
- Mutual matching and conversation creation only after reciprocal intent; Secret Crush identities remain private until mutual reveal.
- Server-side age-only eligibility: both participants must have trusted age status verified, profiles visible and opted in, and no block in either direction.
- Supabase-backed private match messaging with guarded reads, actor-bound send RPC, rate limits and Realtime updates.
- Age-gated community feed/comment reads and comment submission; anonymous execution revoked and underlying tables default-deny.
- Authenticated `get_my_age_verification_status()` RPC. The app checks it on sign-in and app foreground, fails closed on errors, and keeps all tabs locked until the server returns `verified`.
- UNESWA student verification removed from onboarding and all eligibility logic. Obsolete student-status and student-provider-reference columns have also been removed from the database.
- Android GitHub Actions debug APK workflow.

### Still required for Stage 1 completion
- Select and integrate a trusted 18+ age-assurance provider with signed server callback/webhook verification. Never set verified status from the mobile client.
- Confirm Supabase public Data API exposure, Auth redirect allowlist, production SMTP and sender-domain authentication.
- Physical-device Android/iOS testing for signup, email confirmation, SecureStore, password recovery, logout, navigation and messaging.
- Create controlled test accounts and run two-account adversarial tests for discovery, reciprocal/non-reciprocal likes, Secret Crush non-disclosure, message authorization, block revocation, comment access and rate limits.
- Complete moderation review queue, staff roles/audit history, account deletion/export and retention/deletion jobs.
- Complete privacy/legal review and data inventory for launch jurisdictions.

## Stage 2 — Media and moderation

Implement authenticated media upload sessions, ownership-bound media metadata, safe playback, processing states and moderation gates. Add a private report-review queue, least-privilege moderator actions, audit history, appeals/escalation and server-side suspension enforcement. Do not publish user media until content controls are operational.

## Stage 3 — Notifications, calls and events

Add device-token registration/revocation, generic privacy-safe push payloads, in-app notifications and delivery monitoring. Add campus/community events. Add one-to-one call invitations and call state with short-lived provider tokens issued only after rechecking age eligibility, active match and both block directions. Calls are not recorded by default.

## Stage 4 — Admin, account rights and payments

Add a separate staff/admin surface with least-privilege roles and audit logs. Implement account deletion, data export, retention jobs, consent records and privacy-safe operational monitoring. Add premium/payment functionality only after a provider confirms Eswatini merchant onboarding and settlement and app-store billing requirements are resolved. Do not activate charges in a prototype.

## Stage 5 — Release readiness

Resolve dependency audit findings through compatible upstream updates; do not use `npm audit fix --force`. Validate iOS/Android release builds, device-only paths, database migrations/backups, secrets handling, monitoring/alerts, abuse response, accessibility, privacy review and the complete launch gate in `SECURITY.md`. Production signing keys and provider credentials belong in approved secret management, never Git.

## Current verified baseline — 15 November 2026

- Supabase CRUSH project is ACTIVE_HEALTHY in EU West, on the organization's Free plan.
- Hosted migration history contains 15 entries, including messaging RPCs, age-only eligibility, age-gated community reads/status and removal of obsolete student-verification columns.
- Read-only SQL checks confirm all inspected SECURITY DEFINER functions use an empty search_path, none are executable by anon, private verification data has no client SELECT grants, and no current SECURITY DEFINER function references `student_status`.
- The photo bucket is private with a 5 MiB image limit.
- Security Advisor reports three intentional default-deny RLS/no-policy INFO findings and 13 authenticated SECURITY DEFINER warnings; Performance Advisor reports 12 unused-index INFO findings. Preserve the current least-privilege design and review these functions when they change.
- There are zero Auth users and zero profiles. No two-account test has yet run.
- The age-verification provider is not connected, so the app remains locked for every new account by design.
- Production SMTP, physical-device validation, moderation/admin, account deletion/export, backup/restore drill, monitoring and production signing remain outstanding.

## Provider direction

Supabase is the selected backend and authentication platform. The previous NestJS + Clerk direction is superseded. Age-assurance, SMTP, media, calls and moderation vendors remain conditional and are recorded in `PROVIDER_DECISIONS.md`. A vendor candidate is not a contract, account connection or proof of Eswatini eligibility.
