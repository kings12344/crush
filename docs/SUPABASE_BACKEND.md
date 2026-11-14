# CRUSH Supabase backend

Updated 14 November 2026.

## Supabase project

- Project: `CRUSH`
- Project reference: `dtlbpkcaojctamelogbv`
- Region: `eu-west-1` (Europe West)
- Project URL: `https://dtlbpkcaojctamelogbv.supabase.co`
- Organization: `kings12344's Org`

The mobile client uses the Supabase **publishable** key only. Never place a secret key, legacy service-role key, database password, or vendor secret in Expo public variables or Git.

## Database foundation

Hosted migrations create:
- University of Eswatini and Kwaluseni campus seed records.
- Profiles linked to Supabase Auth users.
- Likes, Secret Crush, matches, conversations and messages.
- Blocks and user-submitted reports.
- Private age/student verification status records.
- A private `profile-photos` Storage bucket, limited to JPEG, PNG and WebP up to 5 MB.
- Row Level Security on application tables and verification records.
- Realtime publication membership for messages.

Migration files:
- `supabase/migrations/20261114175834_initial_crush_core.sql`
- `supabase/migrations/20261114175851_realtime_messages_and_indexes.sql`
- `supabase/migrations/20261114180414_lock_profiles_until_verified.sql`
- `supabase/migrations/20261114180508_deny_client_verification_access.sql`

The migrations are applied to the hosted project. Supabase's security advisor now reports an informational `RLS Enabled No Policy` lint only if its cache has not refreshed; the explicit deny policy is intended to make client access impossible. The database has not yet been through a complete adversarial RLS test suite.

## Mobile authentication implementation

The Expo app now includes:
- Pinned `@supabase/supabase-js` v2.119.0 and React Native URL polyfill v4.0.0.
- Expo SecureStore-backed session persistence, split into small encrypted chunks to accommodate platform storage limits.
- PKCE auth flow, automatic token refresh while the app is foregrounded, and auth-state routing.
- Email/password registration and sign-in.
- Email confirmation callback.
- Password recovery and password update callback.
- Automatic creation of a private, hidden profile after the user obtains a session.
- A pending-access screen. Signing in does not grant dating/discovery access.

The session store is not yet validated on physical Android and iOS devices. Web sign-in is deliberately disabled until a cookie-backed web session architecture is implemented. A failure to store the native session should be treated as a sign-in failure and tested before launch.

## Required Supabase Dashboard configuration

Open **Authentication → URL Configuration** in the Supabase Dashboard:

1. Keep the Site URL set to a safe HTTPS website you control (or the dashboard's temporary default while testing).
2. Add these exact values under Additional Redirect URLs:
   - `crush://auth/confirmed`
   - `crush://auth/reset-password`
3. Save the settings.

Open **Authentication → Providers → Email** and confirm email/password sign-up is enabled and email confirmation is required. Do not disable confirmation for production.

Supabase's default email sender is rate-limited and is not suitable for a public launch. Configure a production SMTP provider, sender domain, SPF/DKIM/DMARC and delivery monitoring before inviting users. The app should be tested with real devices and email addresses you control.

## Environment

Copy `.env.example` to `.env` for local development. The example includes the public project URL and publishable key. The `.env` file is ignored by Git.

The Android GitHub Actions workflow also injects those same public client values so its test APK can reach this project. A publishable key is intended to be present in a mobile binary; database security depends on RLS and server-side authorization, not key secrecy.

## Important security boundaries

- Profiles are readable only by their owner. Public discovery is intentionally not exposed yet.
- Profiles can only be created or updated with `visibility = 'hidden'` through the client. A trusted server must explicitly approve and publish a profile after age and student verification.
- Direct client inserts into likes and Secret Crush are revoked until trusted server-side workflows enforce eligibility, rate limits, mutual-match rules and both directions of blocks.
- Clients cannot create matches or conversations. Those must be created through trusted server-side logic after eligibility and mutual-like checks.
- Secret-crush rows are not readable by mobile clients. Sender identities must only be disclosed after an authorized mutual reveal.
- Messages are limited to active match participants, and both directions of a block prevent access.
- Verification records are in a private schema with RLS enabled and an explicit deny policy for `anon` and `authenticated`. They are server-only.
- The app is not production-ready. Age assurance, UNESWA student verification, moderation, admin tools, data export/deletion and a complete security test suite remain outstanding.

## Remaining implementation

1. Complete Supabase Auth redirect and email provider configuration in the dashboard.
2. Run the Android PR build and TypeScript checks; resolve any failures.
3. Test signup, email confirmation, login, password recovery, session persistence and logout on physical Android and iOS devices.
5. Implement trusted age assurance and a University-approved UNESWA student verification workflow. Accounts must remain hidden and ineligible until both checks are verified.
6. Add server-side discovery, mutual-like matching, Secret Crush reveal, unmatch, block and report workflows.
7. Add realtime messaging only after match and block authorization tests pass.
8. Add moderator workflows, audit trail, account deletion/export and retention controls.
9. Complete penetration-style RLS/API tests, backups, alerts and the production launch review.
