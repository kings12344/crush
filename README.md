# CRUSH Mobile App

CRUSH is a student social-discovery app exclusively for current University of Eswatini (UNESWA) students aged 18+, starting at Kwaluseni.

## Stack

- React Native + Expo + TypeScript
- Expo Router
- Supabase Auth, PostgreSQL, private Storage and Realtime
- Supabase Row Level Security on application data

## Run locally

1. Install Node.js 22 or later.
2. Copy .env.example to .env.
3. Run npm ci.
4. Run npm run typecheck.
5. Run npx expo start and launch on a physical device or simulator.

The publishable key in .env.example is a public mobile-client key, not a secret. Never add a Supabase secret/service-role key or database password to the app or repository.

## Authentication

The current Supabase integration includes email/password registration, sign-in, email confirmation, password recovery and reset, PKCE, and SecureStore-backed native session persistence. After authentication, CRUSH creates an owner-only profile that remains hidden.

For email confirmation and password recovery, add these exact redirect URLs in Supabase Dashboard → Authentication → URL Configuration → Additional Redirect URLs:

- crush://auth/confirmed
- crush://auth/reset-password

Email/password sign-up must keep email confirmation enabled. The default Supabase email sender is for testing only; configure a production SMTP provider before public use.

## Current status and safety boundary

**CRUSH is still a development build, not a production dating app.** The Supabase project and database schema are live, and the mobile authentication integration is implemented on the feature branch. The Android pull-request workflow runs TypeScript checks and builds a sideloadable debug APK. Physical-device authentication and session persistence still need testing.

The app reads age and UNESWA student eligibility from separate authenticated Supabase RPCs and keeps every tab locked until the server reports both statuses as verified. Neither trusted verification provider is connected yet, so new accounts remain pending. The follow-up migration restores the private student-status fields and re-gates discovery, likes, Secret Crush, mutual-match messaging and community reads/writes. The hosted database remains on its previously applied age-only schema until the additive migration is reviewed and applied; no production migration was run in this change. Direct client writes to sensitive tables remain revoked. Two-account adversarial tests and physical-device validation are still required before launch.

Reporting and blocking have authenticated RPCs with server-derived actor identity and rate limits. The report review queue, moderation operations, account deletion/export and full messaging experience are not complete. The discovery, reels, matches and inbox areas still include prototype/local preview behavior. Do not present sample profiles or interactions as real users or real activity. Do not invite public users or collect real identity documents. Use controlled test accounts only until device, privacy and security tests pass.

The Expo SDK 58 dependency audit still reports 3 moderate advisories and no high or critical findings. See docs/SECURITY.md, docs/SUPABASE_BACKEND.md, and docs/IMPLEMENTATION_ROADMAP.md.

## Android test APK

The Android debug APK GitHub Actions workflow runs on pushes to main, pull requests targeting main, and manual dispatch from the repository's Actions tab. When a run succeeds, download the crush-android-debug-apk artifact, unzip it, and install app-debug.apk on an Android phone.

This is a **debug build for testing**, signed with a temporary runner-generated debug key. It is not release-signed or published to Google Play. A later build may not update over an APK signed by a different temporary key; uninstall the older test build first if Android refuses the update. Artifacts are retained for 30 days.

## Standalone Android APK (no Metro)

The **Android standalone release APK** workflow generates the Android native project, runs Gradle's assembleRelease task, and uploads the crush-android-standalone-release artifact. This release-mode test build is intended to include the JavaScript bundle, so it should not require Metro. See docs/ANDROID_RELEASE_BUILD.md for installation instructions. The APK still needs a successful CI run and physical-device testing before it can be considered verified. This is not a production signing setup.

## Product and privacy rules

- Strictly 18+ and current UNESWA student status; both eligibility requirements must be enforced by trusted services, not client checkboxes.
- Trusted 18+ age assurance and current UNESWA student verification must be enforced by the server; client-entered dates, student numbers and checkboxes cannot grant eligibility.
- Keep any age/student-verification evidence private, minimize retention, and store only the minimum outcome/reference data needed.
- Unmatched Secret Crush senders must never be revealed.
- Only eligible, mutually matched users can use dating chat and calls; block state overrides matching.
- No precise live location.
- Never present mock data as real users/actions or transactions.
