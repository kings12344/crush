# CRUSH Security Baseline and Launch Gate

**Current status: development integration — not cleared for public users or sensitive personal data.** A Supabase project and PostgreSQL schema are deployed. The mobile feature branch includes email/password Auth, PKCE callbacks, a SecureStore-backed session adapter and hidden-profile creation. This code has not yet passed physical-device testing or a full adversarial security review. Age assurance, UNESWA student verification, discovery, trusted matching, production messaging, moderation and account-rights workflows remain incomplete.

## Protect these assets

Account identity and email; date of birth and age evidence; student verification documents; private photos and messages; unmatched Secret Crush sender identities; location and campus information; reports and moderator notes; authentication/session tokens; and push-notification content.

## Required architecture

1. **Identity and sessions.** Use a maintained identity provider with Authorization Code + PKCE, verified redirect URIs, email verification, secure recovery, abuse/rate limiting, and short-lived access tokens. Never implement password hashing or token cryptography yourself. CRUSH uses Supabase Auth. Its JS client persists the serialized session through an OS-backed SecureStore adapter on native platforms; do not fall back to AsyncStorage for credentials. The adapter splits the serialized session into small chunks because native secure-storage platforms can reject large values. Validate this on physical Android and iOS devices, test interrupted writes and sign-out, and configure short session lifetimes/revocation appropriately. If the threat model requires access tokens to exist only in memory, design and test a refresh-token-only storage adapter rather than assuming the current SDK storage format does that.
2. **Server-side authorization.** Authenticate and authorize every endpoint and Realtime channel. Derive user identity from the verified token, never a client-supplied user ID. Enforce account status, 18+ eligibility, verified-student rules, match membership, visibility, and both directions of blocks on the server. Use deny-by-default authorization, least-privilege DB roles, parameterized queries, request schemas, bounded pagination, payload limits, and safe error responses. Apply PostgreSQL RLS with explicit policies that match the access model.
3. **Dating and Secret Crush privacy.** Return only fields required for discovery. Do not expose exact birth date, email, legal name, verification evidence, precise location, internal moderation state, or unmatched crush sender IDs. A secret-crush reveal must be atomic and occur only after both eligible users reciprocate. Prevent interactions, chats, presence, and calls if either user blocks the other or a match is revoked. Test these rules against direct API requests, not only UI flows.
4. **Age and student verification.** Treat client DOB checks as hints. Enforce 18+ on trusted server logic and select a lawful, proportionate age-assurance method for launch jurisdictions. Keep verification artifacts in a separate private storage bucket with short-lived signed access, strict staff roles, access audit logs, malware/type/size checks, retention/deletion policy, and no public URLs. Prefer storing verification outcome and provider reference over raw documents; do not expose them in support/admin responses.
5. **Transport, storage, and secrets.** Require HTTPS/TLS for all environments beyond localhost. Store provider/database secrets only in server secret management; mobile EXPO_PUBLIC_* variables are public. The Supabase publishable key is designed for client use and is not an authorization boundary. Encrypt sensitive backups and private media; rotate secrets and have a tested incident response and restore process. Avoid collecting exact location. Redact sensitive values from telemetry and crash tools.
6. **Safety and moderation.** Production requires real block/report endpoints, review queues with least-privilege staff access, evidence retention rules, appeals/escalation policies, abuse throttles, and an emergency disclaimer. A block must take effect server-side across discovery, messaging, calls, and notifications. Reports must not notify the reported user of the reporter's identity. Provide account deletion/data export and explain retention exceptions.
7. **Client hardening.** Validate all remote data at runtime and render user content as plain text. Use allowlisted deep links, safe WebViews, restrictive permissions, no cleartext traffic, and minimal data collection. Review Android backup/data extraction and iOS backup/keychain behavior. Consider certificate pinning only with a robust key-rotation/recovery plan; pinning without operational rotation can lock users out. Use platform security updates and release signing protections.

## Database controls currently deployed

- All 10 public application tables have RLS enabled.
- private.verification_records has RLS enabled and an explicit deny policy for anon and authenticated; it is server-only.
- Profiles are readable only by their owner. Client profile insert/update policies require visibility = hidden.
- Direct client INSERT grants on likes and secret_crushes are revoked until trusted server workflows exist.
- Clients cannot create matches or conversations.
- Message reads/inserts require match participation and no block in either direction.
- The profile-photos Storage bucket is private and owner-scoped.
- Supabase Security Advisor returned no findings after the latest migration. Performance Advisor currently shows unused-index informational notices because the new tables have little/no production traffic.

These controls are a foundation, not proof of complete authorization. RLS policy behavior and every write path still need adversarial integration tests.

## Release checklist (all required)

- [ ] Threat model reviewed; data inventory, jurisdiction/privacy review, retention schedule, and incident owner approved.
- [ ] Backend and provider configuration deployed separately from the mobile bundle; production secrets cannot be extracted from the app.
- [ ] Automated tests cover broken object authorization, account enumeration, rate limits, session rotation/revocation, replay, block bypass, match revocation, and Secret Crush identity disclosure.
- [ ] Age/student verification bypass and document access tests pass; moderator/admin access is least privilege and audited.
- [ ] Dependency audit, static analysis, secret scan, API security tests, and mobile MASVS-aligned review completed; high/critical findings resolved or explicitly risk-accepted.
- [ ] Privacy-safe logs/analytics, alerting, backup restore, account deletion, data export, and incident-response drills verified.
- [ ] Real-device iOS/Android tests cover secure token storage, app-switcher screenshots, deep links, network failure, logout, and accessibility.
- [ ] No demo profiles/actions appear as real users/actions and no live user data is used in demo builds.

## Current implementation

- **Dependency audit remains open (2026-11-14):** The Expo SDK 58 dependency audit reports 3 moderate advisories and no high or critical findings. Do not force a major-version audit fix. Resolve compatible upstream updates and re-run the audit before release.
- Supabase Auth code implements email/password signup, sign-in, email confirmation and password recovery/reset. Redirect URLs still need to be allowlisted in the Supabase dashboard. Device-level validation remains outstanding.
- The mobile app routes signed-in users to a pending-access screen. It does not unlock discovery or matching based on client-supplied information.
- Profiles created from Auth are hidden. No public discovery API or trusted verification workflow exists yet.
- Age assurance and UNESWA student status remain pending; no verification provider or University-approved manual process is connected.
- Likes and Secret Crush inserts are blocked for mobile clients until server-side eligibility and anti-abuse rules are implemented.
- Match, conversation, realtime chat, moderation, admin, account deletion and data export workflows are incomplete.
- Discovery/reels/inbox sample interactions and four privacy-preview switches remain local prototype features; they do not affect a real account or server.
- The SQL migrations are tracked under supabase/migrations/ and have been applied to the CRUSH Supabase project.
