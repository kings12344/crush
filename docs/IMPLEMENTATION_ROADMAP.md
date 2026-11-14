# CRUSH implementation roadmap

This roadmap turns the gaps documented in `BUILD_STATUS.md`, `SECURITY.md`, `API_PLAN.md`, and `INTEGRATIONS.md` into a staged implementation. The current repository is a frontend prototype; none of the stages below should be described as complete until code, configuration, and relevant tests demonstrate the outcome.

## Stage 1 — Trusted core

Implement the API and PostgreSQL persistence for account identity, profile editing, preferences, discoverability, dating/friend modes, profile discovery, likes, mutual matches, private conversations, messaging, unmatch, block, and report. Every operation must use verified server identity, validate eligibility and active account status, and enforce both directions of a block. Secret-crush sender identity must remain hidden unless an eligible mutual reveal is authorized. Add integration tests for authorization boundaries, block bypass, match revocation, and secret-crush disclosure.

Implement server-side age and student-verification states as separate workflows. Until a vendor or approved University of Eswatini review process is configured, account eligibility must remain pending; never turn a client DOB field, email domain, or demo flag into verified status. Store outcome/reference and minimal audit data, not identity-document images in the application database.

## Stage 2 — Media and moderation

Add private image/video upload sessions, ownership-bound media metadata, playback authorization, video processing states, comments and interactions. Add report intake, a private moderator queue, least-privilege review actions, audit history, appeals/escalation status, and server-side block/suspend enforcement. Do not publish user media until required moderation gates pass. Vendor classification may inform review but cannot be the only enforcement decision.

## Stage 3 — Notifications, calls, and events

Add device-token registration and revocation, generic privacy-safe push payloads, in-app notifications, delivery retries/receipts, campus events, registrations, and cancellation rules. Add one-to-one call invitations and call state with short-lived provider tokens issued only after rechecking eligibility, active match, and both block directions. Calls are not recorded by default.

## Stage 4 — Admin, account rights, and payments

Add a separate staff/admin surface with strict role separation, least-privilege scopes and audit logs. Implement account deletion, data export, retention/deletion jobs, consent records, and privacy-safe operational monitoring. Add premium entitlements and payment lifecycle only after a payment provider confirms Eswatini merchant onboarding and settlement, and after app-store billing requirements for digital benefits have been resolved. Never activate charges in a prototype.

## Stage 5 — Release readiness

Upgrade the Expo SDK and resolve the known dependency audit findings through a planned SDK migration rather than `npm audit fix --force`. Validate iOS/Android builds and device-only paths, backend security controls, database migrations/backups, secrets handling, operational alerts, abuse response, accessibility, privacy review, and the full launch gate in `SECURITY.md`. Deployment and production credentials remain operator-owned and must not be committed to Git.

Progress as of 2026-11-14: the project has moved sequentially from SDK 56 through SDK 57 to SDK 58. TypeScript passes, `npx expo install --check` passes, Expo Doctor reports 20/20 checks, and Expo Web export succeeds. `npm audit` still reports 3 moderate findings. No iOS/Android release build, physical-device verification, backend, provider account, or live credential was available; Stage 5 and production readiness remain incomplete.

## Provider direction and gates

The existing target stack is Expo/React Native, NestJS, PostgreSQL, WebSockets, private object/media storage, APNs/FCM push, a WebRTC provider, and a separate admin portal. Current provider notes and official references are in `PROVIDER_DECISIONS.md`.

Current conditional technical shortlist: Clerk for Expo identity (after confirming Eswatini contracting eligibility); Expo Push Service for initial notifications; Cloudinary for media if authenticated delivery and Expo native-build compatibility are validated; Daily for calls after a device/network pilot; Hive for moderation after account and Dashboard access are confirmed. Didit is only an age/document-verification candidate, not student-status verification. SheerID's UNESWA coverage is unconfirmed; until confirmed, student review needs a University-approved manual process. Payment provider availability is unresolved: DPO is a candidate to ask, not a verified Eswatini merchant solution. Do not implement vendor assumptions as verified facts.

Code can be scaffolded against interfaces before accounts are provisioned. Live integrations require vendor confirmation, user-owned accounts, credentials stored only in server-side secret management, written terms/retention review, and end-to-end device tests. This roadmap is not a claim of production readiness, legal compliance, or provider eligibility.
