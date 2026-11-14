# Build Status

## Implemented in the current Supabase feature branch

- Expo Router app scaffold and five-tab navigation.
- CRUSH visual theme and prototype Discover, Reels, Matches, Inbox and Profile screens.
- Supabase project and initial database schema deployed.
- RLS enabled on all public tables and private verification records.
- Hidden owner-only profile creation.
- Direct client writes to likes and Secret Crush disabled until trusted server workflows exist.
- Private profile-photo Storage bucket and Realtime publication for messages.
- Supabase Auth email/password registration and sign-in code.
- PKCE email confirmation and password recovery/reset callbacks.
- Native SecureStore-backed session persistence.
- Authenticated users routed to a pending-access screen until age and student eligibility are verified.
- Android pull-request workflow with TypeScript check and debug APK build.

## Not implemented / not ready for launch

- Physical-device validation of registration, confirmation links, SecureStore sessions, recovery and logout.
- Production SMTP sender and final Auth redirect configuration.
- Trusted 18+ age assurance.
- University-approved student verification.
- Eligible profile discovery and public profile-read policies.
- Trusted like, mutual-match and Secret Crush reveal workflows.
- Production conversations, messaging UI and Realtime subscriptions.
- Media uploads to production users, video transcoding and moderation.
- Audio/video calls.
- Events backend.
- Push notifications.
- Payments and subscriptions.
- Moderator/admin portal, account deletion/export and retention jobs.
- Full RLS/API adversarial testing, backups, monitoring and production release signing.

Never represent demo profiles or interactions as real. Do not invite public users until all eligibility, safety, privacy and release gates pass.
