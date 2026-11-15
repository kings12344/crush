# External integrations checklist

## Connected / selected

- Supabase project: CRUSH, EU West.
- Supabase Auth: email/password sign-up, sign-in, confirmation and password recovery code integrated in the mobile feature branch.
- PostgreSQL: initial application schema and RLS migrations applied.
- Supabase Storage: private profile-photo bucket created with owner-scoped policies.
- Supabase Realtime: messages table added to the publication; app subscription is not yet implemented.

## Still pending

- Production SMTP sender, domain authentication and delivery monitoring for Auth emails.
- Trusted age-assurance provider and 18+ enforcement.
- University-approved UNESWA student verification process.
- Video hosting/transcoding/streaming provider.
- Human moderation operations and optional content-classification provider.
- WebRTC audio/video provider.
- Push notifications (FCM/APNs and Expo Push).
- Payment provider confirmed for Eswatini merchant onboarding and settlement.
- Admin portal, incident response and account deletion/export tooling.

Before selecting vendors, verify current Eswatini availability, pricing, data location, legal terms, retention, and React Native SDK compatibility. Do not treat a technical API or public documentation as proof that a provider will onboard an Eswatini business.
