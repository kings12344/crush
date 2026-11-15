# Backend API plan — Supabase

## Selected approach

CRUSH uses Supabase Auth, PostgreSQL, private Storage, Realtime and Edge Functions. The previous NestJS REST API plan is superseded. The mobile app uses the Supabase JS client and the Data API only where RLS grants the intended operation.

## Authentication — integrated in the feature branch

- Supabase Auth email/password sign-up and sign-in.
- PKCE email confirmation callback.
- Password recovery and reset callback.
- Native session persistence through Expo SecureStore.
- Owner-only hidden profile creation after authentication.

## Database tables

- profiles, universities, campuses
- likes, secret_crushes
- matches, conversations, messages
- blocks, reports
- private.verification_records (server-only)

## Trusted server operations — still to implement

Use Edge Functions or carefully scoped database functions for:
- age/student verification status updates from approved providers or staff review
- eligible profile discovery and profile visibility
- like submission, rate limiting and mutual-match creation
- Secret Crush submission and atomic mutual-reveal
- unmatch, block enforcement and report intake/moderation
- conversation creation and server-validated messaging
- short-lived signed media access and upload validation
- account deletion/export and retention workflows

The client must not receive service-role credentials or write verification outcomes. Do not grant direct client inserts into likes or Secret Crush until eligibility, anti-abuse, recipient eligibility and block checks are enforced by trusted code.

## Messaging and Realtime

Messages are stored in PostgreSQL and the messages table is in the Supabase Realtime publication. Realtime subscriptions must only be added after match membership, active account status and both directions of block authorization have been tested.

## Security

All public tables have RLS enabled. Profiles remain owner-only and hidden. Match and conversation creation are not granted to mobile clients. Secret Crush sender identities are not readable by mobile clients. The database schema is not a substitute for a full authorization test suite.
