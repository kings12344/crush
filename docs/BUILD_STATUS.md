# Build Status

Updated 15 November 2026. The active implementation work is on `feat/production-readiness`, based on `feat/supabase-backend-foundation`.

## Implemented and deployed

- Expo Router / React Native / TypeScript application with Supabase Auth and SecureStore-backed native sessions.
- Supabase project in EU West on the organization's Free plan; 15 database migrations are recorded in the hosted project.
- RLS enabled on all 12 public application tables; verification records and rate-limit state remain in the private schema with no client table access.
- Private profile-photo bucket (JPEG/PNG/WebP, 5 MiB limit).
- Authenticated discovery, likes, Secret Crush, block/report RPCs, match-only messaging, and Realtime message reads.
- UNESWA student verification removed from all eligibility checks; the obsolete student-status and student-provider-reference database columns have also been dropped.
- Authenticated `get_my_age_verification_status` RPC; app navigation now fails closed and checks status on sign-in and app foreground. Every tab stays locked until trusted 18+ age assurance is verified.
- Community feed and comment reads now require an authenticated, age-verified account; anonymous execution is revoked.
- Android debug APK workflow; the latest pre-hardening debug workflow run succeeded on the prior feature commit.

## Not ready for public launch

- Trusted 18+ age-verification provider and server callback are not connected. New accounts remain pending by design.
- Auth redirect allowlist and production SMTP sender are not configured/verified in the dashboard.
- Physical Android/iOS testing of signup, email confirmation, SecureStore, recovery, logout, and chat is outstanding.
- No controlled Auth users exist in Supabase yet; two-account matching, Secret Crush privacy, messaging and block-revocation tests have not run.
- Moderation review queue, staff roles/audit trail, account deletion/export, retention jobs and incident-response process are incomplete.
- Media upload/transcoding/moderation, calls, push notifications, events and payments are not production features yet.
- Production signing, backups/restore test, monitoring/alerts, privacy/legal review and full mobile/API security review remain outstanding.

Do not invite public users or publish a production release until the age-assurance, safety, privacy, device and operational gates pass. Demo data must never be presented as real users or activity.
