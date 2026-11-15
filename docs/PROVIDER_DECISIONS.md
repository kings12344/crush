# Provider shortlist and availability gates

## Selected backend and authentication decision — 14 November 2026

The user selected Supabase and approved replacing the previous NestJS + Clerk direction. Supabase is the backend and authentication platform for CRUSH. The hosted project is CRUSH (`dtlbpkcaojctamelogbv`) in EU West. The mobile branch integrates Supabase Auth and a SecureStore-backed session adapter; the database schema, private photo bucket and RLS controls are deployed.

Clerk and Auth0 are historical alternatives, not current implementation choices. Supabase Auth email confirmation and password recovery redirect URLs still need to be allowlisted in the dashboard. A production SMTP sender has not been selected or configured. Do not expose any Supabase secret/service-role key in the app.

Reviewed 15 November 2026. These are conditional technical directions, not vendor contracts or legal advice. A missing country restriction is not proof that a vendor will onboard an Eswatini-based operator. Confirm local eligibility, pricing, data processing terms, retention and device/network behavior directly before production.

## Identity and email

**Historical alternative (not selected): Clerk (`@clerk/expo`).** Clerk documents an Expo integration, with hosted flows usable in Expo Go and native UI requiring a development build. Authentication does not prove age. Keep secret keys server-side and add abuse controls if this historical option is ever reconsidered.

Official references: [Clerk Expo quickstart](https://clerk.com/docs/expo/getting-started/quickstart), [Expo's Clerk guide](https://docs.expo.dev/guides/using-clerk/), [Clerk pricing](https://clerk.com/pricing), [Clerk DPA](https://clerk.com/legal/dpa).

Auth0 is also a historical alternative, not selected for the current build. [Auth0 Expo quickstart](https://auth0.com/docs/quickstart/native/react-native-expo), [Auth0 pricing](https://auth0.com/pricing/).

Supabase Auth handles account email flows. A production SMTP provider is still required; Resend and Amazon SES are technical candidates, but Eswatini business onboarding and mailbox deliverability must be confirmed. Do not expose SMTP/API secrets in the app.

Official references: [Resend + Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp), [Resend pricing](https://resend.com/pricing), [Amazon SES SMTP](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html), [Supabase regions](https://supabase.com/docs/guides/platform/regions).

## Trusted 18+ age assurance

Trusted age assurance is mandatory. Enrollment or student verification is not required for CRUSH eligibility.

**Didit** is a conditional candidate for ID/document-based age decisions. Its technical docs describe document-check capability, but the exact Eswatini document types, Eswatini customer eligibility, pricing and legal suitability have not been independently confirmed. No Didit account, API key, webhook or production integration is configured. Before selection, confirm Eswatini onboarding, age-estimation/ID-verification method, false-accept/false-reject handling, data location, retention/deletion, subprocessors and cost. Keep only minimum outcome/reference metadata in CRUSH; do not retain raw identity documents unless a separate legal/privacy review requires it.

Any provider integration must use a server-side session creation flow and signed server-to-server result verification. The mobile client must never submit or set a verified status. The current app and database remain fail-closed until that trusted integration exists.

Official references: [Didit ID verification overview](https://docs.didit.me/core-technology/id-verification/overview), [Didit pricing](https://docs.didit.me/getting-started/pricing), [Didit React Native SDK](https://docs.didit.me/integration/sdks), [Didit sessions API](https://docs.didit.me/sessions-api/create-session).

## Media and video

**Conditional media candidate: Cloudinary Image & Video API.** Its documentation covers React Native upload and video delivery/transcoding. For dating-app media, configure authenticated delivery and backend-generated signed access; default public CDN URLs and random identifiers are not access control. Test a native development build and confirm Eswatini company billing eligibility.

Official references: [Cloudinary React Native uploads](https://cloudinary.com/documentation/react_native_image_and_video_upload), [control media access](https://cloudinary.com/documentation/control_access_to_media), [video delivery](https://cloudinary.com/documentation/video_manipulation_and_delivery), [Cloudinary pricing](https://cloudinary.com/pricing).

Supabase Storage is already used for private profile-photo objects. It is not a complete video-transcoding/streaming service; any video feature requires separate processing and playback controls. [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [resumable uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads).

## Calls

**Conditional call candidate: Daily Video SDK.** It documents a React Native SDK and Expo config plugin; Expo Go is not supported, so use native development builds. CRUSH must implement its own call UI, and tokens must be short-lived and server-issued after access checks. Confirm Eswatini account/billing eligibility and test call quality on target networks.

Official references: [Daily React Native overview](https://docs.daily.co/docs/react-native.md), [installation](https://docs.daily.co/docs/react-native/installation.md), [Daily pricing](https://www.daily.co/pricing/).

## Push notifications

**Initial direction: Expo Push Service via `expo-notifications`.** Expo documents the integration and does not charge for Expo Push Service sends. Configure FCM/APNs credentials for native builds and treat delivery as best-effort. Use generic payloads only; retrieve private messages after authenticated app open.

Official references: [Expo push overview](https://docs.expo.dev/push-notifications/overview/), [push setup](https://docs.expo.dev/push-notifications/push-notifications-setup/), [Expo FAQ](https://docs.expo.dev/push-notifications/faq/).

## Moderation

**Conditional moderation candidate: Hive Moderation.** The reviewed official material describes content classifiers and a separate Moderation Dashboard with human review/report workflows. Dashboard access needs vendor confirmation; do not treat classifier output as a moderation decision. CRUSH still needs a working review queue, escalation, appeal and enforcement process.

Official references: [Hive getting started](https://docs.thehive.ai/docs/getting-started), [Moderation Dashboard](https://docs.thehive.ai/docs/what-is-the-moderation-dashboard), [user reports](https://docs.thehive.ai/docs/submit-user-reports-to-the-dashboard).

## Payments

**No Eswatini merchant provider is verified.** Defer live charges. Before implementation is activated, confirm merchant onboarding, local bank settlement, supported currencies/cards, recurring payments, rates and app-store billing requirements for digital benefits.

Official references: [DPO payments](https://dpogroup.com/online-payments/), [Stripe global availability](https://stripe.com/global), [PayPal Eswatini](https://www.paypal.com/sz/home).

## Do not commit credentials

Provider secret keys, signing secrets, SMTP credentials, service-account files, APNs keys and payment secrets must be stored in server-side secret management. Only explicitly public client values may be included in the mobile environment. Do not commit `.env` files. Provider selection and documentation do not make the app production-ready; see [SECURITY.md](SECURITY.md) and [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md).
