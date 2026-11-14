# CRUSH Supabase backend foundation

Created 14 November 2026.

## Project

- Supabase project: `CRUSH`
- Project reference: `dtlbpkcaojctamelogbv`
- Region: `eu-west-1` (Europe West)
- Project URL: `https://dtlbpkcaojctamelogbv.supabase.co`
- Organization: `kings12344's Org`

Only the project URL and publishable key belong in the mobile app environment. Never put a Supabase secret key, legacy service-role key, database password, or provider secret in Expo public variables or Git.

## Database foundation applied

The hosted database currently contains:
- University of Eswatini and Kwaluseni campus seed records.
- Profiles linked directly to Supabase Auth users.
- Likes, secret-crush requests, matches, conversations and messages.
- Blocks and user-submitted reports.
- A private verification status table.
- A private `profile-photos` Storage bucket, limited to JPEG, PNG and WebP uploads up to 5 MB.
- RLS policies on all public application tables.
- Realtime publication membership for the messages table.

The initial schema is tracked in `supabase/migrations/20261114175834_initial_crush_core.sql`. A follow-up hosted migration added supporting indexes and enabled Realtime publication for messages.

## Important security boundaries

- Profiles are currently readable/writable only by their owner. Public discovery is intentionally not exposed yet.
- Clients cannot create matches or conversations. That must happen through trusted server-side logic after eligibility, mutual-like and block checks.
- Secret-crush rows are not readable by mobile clients. Sender identities must only be disclosed after an authorized mutual reveal.
- Messages are limited to active match participants, and both directions of a block prevent access.
- Verification records are not granted to the mobile roles. Provider review and staff tooling are not implemented.
- The mobile app is not connected to this project yet. Auth flows, app SDK installation, signup/profile creation and session routing remain to be implemented.

## Setup variables

Create a local `.env` from `.env.example` and set:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The publishable key is intended for client use and is protected by RLS. Do not add real credentials to this repository.

## Remaining implementation

1. Configure Supabase Auth email settings, redirect URLs and abuse protections.
2. Add the pinned Supabase JS client and React Native URL/session dependencies; regenerate and commit `package-lock.json`.
3. Connect registration, login, logout, password recovery and session handling.
4. Add a trusted onboarding path for age assurance and UNESWA student verification. Until approved verification is complete, accounts must remain ineligible for discovery and matching.
5. Add server-side discovery, mutual-like matching, Secret Crush reveal, unmatch, block and report workflows.
6. Add message read receipts, realtime subscriptions and push notifications.
7. Add moderator workflows, audit trail, account deletion/export and retention controls.
8. Test RLS allow/deny cases and physical-device builds before any real-user launch.

## Linter note

Supabase's security advisor currently reports that `private.verification_records` has RLS disabled. The schema revokes access to the private schema and table from `anon` and `authenticated`, so the table is not intended for client access; however, the advisor still flags it as critical. Do not expose this schema. Decide and test the server-only access model before enabling RLS with policies.
