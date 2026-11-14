# CRUSH Security Baseline and Launch Gate

**Current security status: prototype only — not safe for real accounts or personal data.** The app has no backend, auth provider, network API, persistence, moderation team, or secure upload. Local checks in React Native are UX validation only and can be bypassed. The changes in this branch improve the prototype and database design; they do not make a deployed service secure by themselves.

## Protect these assets

Account identity and email; date of birth and age evidence; student verification documents; private photos and messages; unmatched Secret Crush sender identities; location and campus information; reports and moderator notes; authentication/session tokens; and push-notification content.

## Required architecture

1. **Identity and sessions.** Use a maintained OIDC/OAuth identity provider with Authorization Code + PKCE, verified redirect URIs, email verification, secure recovery, MFA/passkeys where feasible, abuse/rate limiting, and short-lived access tokens. Never implement password hashing or token cryptography yourself. If the backend owns passwords, use a vetted Argon2id implementation, unique salts and provider-approved parameters; never log or return passwords. Keep access tokens in memory and refresh credentials in OS-backed secure storage (e.g. Expo SecureStore after dependency and platform review), never AsyncStorage, logs, analytics, URLs, or crash reports. Rotate and revoke refresh sessions; support logout-all-devices.
2. **Server-side authorization.** Authenticate and authorize every endpoint and WebSocket event. Derive user identity from the verified token, never a client-supplied user ID. Enforce account status, 18+ eligibility, verified-student rules, match membership, visibility, and both directions of blocks on the server. Use deny-by-default authorization, least-privilege DB roles, parameterized queries, request schemas, bounded pagination, payload limits, and safe error responses. Apply PostgreSQL RLS with provider-specific policies or rigorously tested API authorization; the design schema deliberately does not pretend generic policies are safe.
3. **Dating and Secret Crush privacy.** Return only fields required for discovery. Do not expose exact birth date, email, legal name, verification evidence, precise location, internal moderation state, or unmatched crush sender IDs. A secret-crush reveal must be atomic and occur only after both eligible users reciprocate. Prevent interactions, chats, presence, and calls if either user blocks the other or a match is revoked. Test these rules against direct API requests, not only UI flows.
4. **Age and student verification.** Treat client DOB checks as hints. Enforce 18+ on trusted server logic and select a lawful, proportionate age-assurance method for launch jurisdictions. Keep verification artifacts in a separate private storage bucket with short-lived signed access, strict staff roles, access audit logs, malware/type/size checks, retention/deletion policy, and no public URLs. Prefer storing verification outcome and provider reference over raw documents; do not expose them in support/admin responses.
5. **Transport, storage, and secrets.** Require HTTPS/TLS for all environments beyond localhost. Store provider/database keys only in server secret management; mobile `EXPO_PUBLIC_*` variables are public. Encrypt sensitive backups and private media; rotate secrets and have a tested incident response and restore process. Avoid collecting exact location. Redact sensitive values from telemetry and crash tools.
6. **Safety and moderation.** Production requires real block/report endpoints, review queues with least-privilege staff access, evidence retention rules, appeals/escalation policies, abuse throttles, and an emergency disclaimer. A block must take effect server-side across discovery, messaging, calls, and notifications. Reports must not notify the reported user of the reporter's identity. Provide account deletion/data export and explain retention exceptions.
7. **Client hardening.** Validate all remote data at runtime and render user content as plain text. Use allowlisted deep links, safe WebViews, restrictive permissions, no cleartext traffic, and minimal data collection. Review Android backup/data extraction and iOS backup/keychain behavior. Consider certificate pinning only with a robust key-rotation/recovery plan; pinning without operational rotation can lock users out. Use platform security updates and release signing protections.

## Release checklist (all required)

- [ ] Threat model reviewed; data inventory, jurisdiction/privacy review, retention schedule, and incident owner approved.
- [ ] Backend and provider configuration deployed separately from the mobile bundle; production keys cannot be extracted from the app.
- [ ] Automated tests cover broken object authorization, account enumeration, rate limits, session rotation/revocation, replay, block bypass, match revocation, and secret-crush identity disclosure.
- [ ] Age/student verification bypass and document access tests pass; moderator/admin access is least privilege and audited.
- [ ] Dependency audit, static analysis, secret scan, API security tests, and mobile MASVS-aligned review completed; high/critical findings resolved or explicitly risk-accepted.
- [ ] Privacy-safe logs/analytics, alerting, backup restore, account deletion, data export, and incident-response drills verified.
- [ ] Real-device iOS/Android tests cover secure token storage, app-switcher screenshots, deep links, network failure, logout, and accessibility.
- [ ] No demo profiles/actions appear as real users/actions and no live user data is used in demo builds.

## Current implementation in this project

- **Dependency audit is not clean (2026-11-11):** `npm audit --omit=dev` reports 17 advisories (5 high, 11 moderate, 1 low; no critical). Findings include transitive Expo/Expo Router and utility-package advisories. A non-breaking `npm audit fix` did not resolve them; npm's full fix plan requires an Expo/Expo Router SDK 58 major migration. Do not ship a production build until the SDK migration is planned, upgraded, tested on iOS/Android/web, and the audit is rerun. Do not hide this with an audit-level threshold or blindly force the upgrade.
- Registration now normalizes/checks email syntax, validates real calendar dates and 18+ locally, adds a password confirmation, sets native text-content hints, and uses a stronger minimum password policy for demo UX. It still creates no account and must not be treated as server-side security.
- Login explicitly warns against entering real credentials.
- Discovery actions are local-only, labeled as a preview, and include a report/hide preview action.
- Profile privacy switches are illustrative and not persisted. A safety center explains non-connected controls and practical boundaries.
- The SQL schema uses an external auth subject instead of a local password hash, adds constraints and indexes, and lists authorization requirements. It is a reference schema, not a migration ready to apply to an existing live database.
