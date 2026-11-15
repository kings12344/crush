# CRUSH Security Baseline and Launch Gate

**Current status: development integration; not cleared for public users or sensitive personal data.** The live Supabase project has age-only discovery/matching, private mutual-match messaging, age-gated community reads, and a server-checked age-status gate in the mobile app. UNESWA student verification is not an eligibility requirement. A trusted 18+ age-verification provider is not connected, there are no Auth users yet, and device/two-account adversarial tests have not run.

## Assets to protect

Account identity and email; age-assurance outcomes and minimum necessary evidence; private photos and messages; unmatched Secret Crush sender identities; optional campus information; reports and moderator notes; authentication/session tokens; and privacy-safe notification content.

## Required architecture

1. **Identity and sessions.** Use Supabase Auth with PKCE, verified redirect URIs, email confirmation, secure recovery, abuse/rate limiting and appropriate session expiry/revocation. CRUSH persists native sessions through OS-backed SecureStore; do not fall back to AsyncStorage for credentials. Validate interrupted writes, recovery and sign-out on physical Android and iOS devices.
2. **Server-side authorization.** Authenticate and authorize every endpoint and Realtime channel. Derive identity from the verified token, never a client-supplied user ID. Enforce trusted 18+ eligibility, account state, visibility, match membership and both directions of blocks server-side. Use deny-by-default authorization, least-privilege roles, parameterized queries, bounded pagination, payload limits and safe errors.
3. **Dating and Secret Crush privacy.** Return only fields required for discovery. Never expose exact birth date, email, legal name, age evidence, precise location, internal moderation state or unmatched Secret Crush sender IDs. Reveal a Secret Crush only after both users reciprocate. Prevent interactions, chats and calls if either user blocks the other or a match is revoked.
4. **Trusted age assurance.** Client DOB checks, checkboxes, email domains and user-editable metadata are never proof. Select a lawful, proportionate provider for launch jurisdictions and verify results through a signed server-to-server callback or equivalent trusted mechanism. Never accept a client-supplied `verified` status. Keep evidence in private, access-audited storage with short-lived access, type/size validation and a retention/deletion policy. Prefer retaining only an outcome and provider reference.
5. **Transport, storage and secrets.** Require HTTPS/TLS beyond localhost. Store provider/database secrets only in server-side secret management; mobile `EXPO_PUBLIC_*` variables are public. The Supabase publishable key is not an authorization boundary. Encrypt sensitive backups/private media, rotate secrets, test restore and incident response, avoid precise location, and redact sensitive telemetry.
6. **Safety and moderation.** Production requires a staffed report-review queue, least-privilege moderator roles, audit logs, retention rules, appeals/escalation, abuse throttles and emergency response. Blocks must take effect server-side across discovery, messaging, calls and notifications. Reports must not reveal the reporter to the reported user. Provide account deletion and data export.
7. **Client hardening.** Validate remote data at runtime and render user content as plain text. Use allowlisted deep links, safe WebViews, restrictive permissions, no cleartext traffic and minimal data collection. Review Android backup/data extraction and iOS backup/keychain behavior. Use platform security updates and protected production signing.

## Database controls currently deployed

- RLS is enabled on all 12 public application tables.
- `private.verification_records` and `private.action_rate_limits` have RLS enabled and no direct client table grants.
- Community posts/comments also have RLS enabled with no direct client grants or policies. Narrow SECURITY DEFINER RPCs are the only application read/write path.
- Profiles are readable only by their owner through direct table access. Client profile insert/update policies require visibility = hidden.
- Direct client INSERT grants on likes and Secret Crush are revoked. Authenticated, rate-limited RPCs enforce age status, profile visibility, preferences and both block directions.
- Clients cannot create matches or conversations directly; guarded mutual-action RPCs create them only after reciprocal interest.
- Message reads are protected by RLS and a private conversation guard. The guard requires both match participants to remain age-verified and unblocked. Direct client message INSERT is revoked; sending uses an actor-bound, rate-limited RPC.
- Community feed/comment reads and comment creation require an authenticated, age-verified user. Anonymous execution is revoked.
- The `profile-photos` Storage bucket is private, limited to JPEG/PNG/WebP and 5 MiB, and owner-folder scoped.

## Supabase Advisor review — 15 November 2026

- **3 INFO notices:** RLS-enabled tables without policies: private rate-limit state and the two community tables. This is intentional default-deny; direct client grants are absent and narrow RPCs control access. Do not add permissive policies merely to silence the notices.
- **13 WARN notices:** authenticated execution of SECURITY DEFINER RPCs. These are intended application operations. Catalog checks confirm every inspected SECURITY DEFINER function pins an empty `search_path`, no SECURITY DEFINER function is executable by `anon`, and actor-bound functions derive identity from `auth.uid()`. These checks are not a substitute for code review or adversarial behavior tests.
- **12 performance INFO notices:** unused indexes. The project has negligible traffic; retain them until representative query plans justify changes.
- No health advisor findings were returned.

The database review is catalog/code inspection, not a complete penetration test. The hosted project currently has zero Auth users and zero profiles, so two-account behavior, direct API abuse, race conditions and end-to-end authorization have not yet been demonstrated. The committed pgTAP suite contains 29 catalog assertions but has not been run because pgTAP is not installed in the hosted project.

## Release checklist — all required

- [ ] Threat model, data inventory, launch-jurisdiction privacy review, retention schedule and incident owner approved.
- [ ] Trusted 18+ age provider and signed server-side result verification integrated; bypass tests pass.
- [ ] Supabase Data API exposure, Auth redirect allowlist and production SMTP verified.
- [ ] Automated tests cover broken object authorization, account enumeration, rate limits, session revocation, replay, block bypass, match revocation and Secret Crush identity disclosure.
- [ ] Two-account tests pass for discovery, reciprocal/non-reciprocal likes, Secret Crush, messaging, comments and block revocation.
- [ ] Moderator/admin access is least-privilege and audited; report queue, account deletion/export and retention controls work.
- [ ] Dependency audit, static analysis, secret scan, API security tests and mobile MASVS-aligned review completed; high/critical findings resolved or risk-accepted.
- [ ] Privacy-safe logs/analytics, alerting, backup restore, incident-response drills and operational ownership verified.
- [ ] Real-device iOS/Android tests cover secure token storage, app-switcher screenshots, deep links, network failure, logout, messaging and accessibility.
- [ ] Production release builds are signed with protected credentials; no demo profiles/actions are presented as real users/activity.

## Current implementation and known gaps

- The Expo SDK 58 dependency audit previously reported 3 moderate advisories and no high/critical findings. The Android CI workflow now uses `npm ci` and blocks high-or-critical audit findings. Re-run and review the full audit before release; do not use `npm audit fix --force`.
- Supabase Auth implements email/password signup, sign-in, email confirmation and password recovery/reset. Redirect URLs still need dashboard allowlisting; a production SMTP sender is not configured.
- The app checks age status through `get_my_age_verification_status()` after sign-in and on app foreground. Network/RPC errors fail closed. No trusted provider/callback exists yet, so new accounts remain pending.
- UNESWA student verification has been removed from eligibility logic. The legacy `student_status` column remains only for compatibility; current SECURITY DEFINER functions do not consult it.
- Discovery, likes, Secret Crush, reporting, blocking, private match messaging and age-gated community RPCs are deployed. Two-account adversarial tests remain outstanding.
- The moderation review queue, admin operations, account deletion/export and retention jobs are incomplete.
- Media upload/transcoding/moderation, calls, push notifications, events and payments are not production features yet.
- The current Supabase project has no Auth users or profiles. Do not use real user data until the provider, safety, privacy and operational launch gates are complete.
