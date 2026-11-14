# Provider shortlist and availability gates

## Selected backend and authentication decision — 14 November 2026

The user selected Supabase and approved replacing the previous NestJS + Clerk direction. Supabase is now the backend and authentication platform for CRUSH. The hosted project is CRUSH (reference: dtlbpkcaojctamelogbv) in EU West. The mobile feature branch integrates Supabase Auth and a SecureStore-backed session adapter; the database schema, private photo bucket and RLS policies are applied.

Clerk and Auth0 are historical alternatives, not current implementation choices. Supabase Auth email confirmation and password recovery redirect URLs still need to be allowlisted in the dashboard. A production SMTP sender has not been selected or configured. Do not expose any Supabase secret/service-role key in the app.

Reviewed 14 November 2026. These are conditional technical directions, not vendor contracts or legal advice. A missing country restriction is not proof that a vendor will onboard an Eswatini-incorporated customer. Confirm company eligibility, local settlement, data processing terms, retention, and device/network behavior directly before production.

## Identity and email

**Historical alternative (not selected): Clerk (`@clerk/expo`).** Clerk documents an Expo integration, with hosted flows usable in Expo Go and native UI requiring a development build. Use Clerk only after it confirms that an Eswatini-based organization can contract, pay, and use the required production features. Authentication does not prove age or UNESWA enrollment. Validate Clerk-issued tokens in the API; keep secret keys server-side. Review the documented Native API/CAPTCHA caveat and add abuse controls.

Official references: [Clerk Expo quickstart](https://clerk.com/docs/expo/getting-started/quickstart), [Expo's Clerk guide](https://docs.expo.dev/guides/using-clerk/), [Clerk pricing](https://clerk.com/pricing), [Clerk DPA](https://clerk.com/legal/dpa), [Clerk subprocessors](https://clerk.com/legal/subprocessors).

Auth0 is also a historical alternative, not selected for the current build. [Auth0 Expo quickstart](https://auth0.com/docs/quickstart/native/react-native-expo), [Auth0 pricing](https://auth0.com/pricing/).

Supabase Auth handles account email flows. A production SMTP provider is still required; Resend and Amazon SES are technical candidates, but Eswatini business onboarding and campus mailbox deliverability must be confirmed. Do not expose SMTP/API secrets in the app.

Official references: [Resend + Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp), [Resend pricing](https://resend.com/pricing), [Amazon SES SMTP](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html), [Supabase regions](https://supabase.com/docs/guides/platform/regions).

## Age and student verification

Treat age assurance and enrollment verification as separate checks. **Didit** is a conditional candidate for ID/document-based age decisions; it is not student verification. Its technical docs describe broad document-check capability, but the exact Eswatini document types and Eswatini customer eligibility were not independently confirmed. Keep only minimum outcome/reference metadata in CRUSH and retain documents only under a separately reviewed secure workflow.

Official references: [Didit ID verification overview](https://docs.didit.me/core-technology/id-verification/overview), [Didit pricing](https://docs.didit.me/getting-started/pricing), [Didit React Native SDK](https://docs.didit.me/integration/sdks), [Didit sessions API](https://docs.didit.me/sessions-api/create-session).

**UNESWA student status remains unresolved.** SheerID has verification APIs and a school-search/add-school process, but its official public documentation reviewed did not establish that the University of Eswatini is in its organization catalogue or that an Eswatini operator can purchase the program. Ask SheerID to confirm the school's identifier/addition path, local operator eligibility, and price. A manual review process is a possible fallback only if the University approves the process and evidence handling.

Official references: [SheerID API quickstart](https://developer.sheerid.com/api-quickstart), [search organizations](https://developer.sheerid.com/tutorials/verifications/searching-organizations), [add a school request](https://developer.sheerid.com/tutorials/apis/add-school-request), [University of Eswatini](https://www.uneswa.ac.sz/).

## Media and video

**Conditional media candidate: Cloudinary Image & Video API.** Its documentation covers React Native upload and video delivery/transcoding. For dating-app media, configure authenticated delivery and backend-generated signed access; default public CDN URLs and random identifiers are not access control. The official guide does not by itself establish Expo managed-workflow compatibility. Test a native development build and confirm Eswatini company billing eligibility.

Official references: [Cloudinary React Native uploads](https://cloudinary.com/documentation/react_native_image_and_video_upload), [control media access](https://cloudinary.com/documentation/control_access_to_media), [video delivery](https://cloudinary.com/documentation/video_manipulation_and_delivery), [Cloudinary pricing](https://cloudinary.com/pricing).

Supabase Storage is an alternative for private objects and resumable uploads, but is not a documented full video-transcoding/streaming service. It requires explicit storage policies and separate video processing/playback. Confirm account and region fit before use. [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [resumable uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads).

## Calls

**Conditional call candidate: Daily Video SDK.** It documents a React Native SDK and Expo config plugin; Expo Go is not supported, so use native development builds. CRUSH must implement its own call UI, and tokens must be short-lived and server-issued after access checks. Confirm Eswatini account/billing eligibility and test call quality on target networks. Agora RTC is an alternative, but the reviewed Expo integration path is less direct.

Official references: [Daily React Native overview](https://docs.daily.co/docs/react-native.md), [installation](https://docs.daily.co/docs/react-native/installation.md), [Daily pricing](https://www.daily.co/pricing/), [Agora RTC](https://docs.agora.io/en/realtime-media/rtc).

## Push notifications

**Initial direction: Expo Push Service via `expo-notifications`.** Expo documents the integration and does not charge for Expo Push Service sends. Configure FCM/APNs credentials for native builds and treat delivery as best-effort. Use generic payloads only; retrieve private messages after authenticated app open. Test real devices and local networks. OneSignal is an alternative if campaign features justify additional collection and a separate MAU-priced plan.

Official references: [Expo push overview](https://docs.expo.dev/push-notifications/overview/), [push setup](https://docs.expo.dev/push-notifications/push-notifications-setup/), [Expo FAQ](https://docs.expo.dev/push-notifications/faq/), [OneSignal Expo setup](https://documentation.onesignal.com/docs/en/react-native-expo-sdk-setup), [OneSignal pricing](https://onesignal.com/pricing).

## Moderation

**Conditional moderation candidate: Hive Moderation**, because the reviewed official material describes content classifiers and a separate Moderation Dashboard with human review/report workflows. Dashboard access needs vendor confirmation; do not treat classifier output as a moderation decision. Sightengine is an API-only alternative, but CRUSH would need to implement its own queue, escalation, appeal, and enforcement operations. Confirm Eswatini business eligibility, retention, and pricing with either vendor.

Official references: [Hive getting started](https://docs.thehive.ai/docs/getting-started), [Moderation Dashboard](https://docs.thehive.ai/docs/what-is-the-moderation-dashboard), [user reports](https://docs.thehive.ai/docs/submit-user-reports-to-the-dashboard), [Sightengine pricing](https://sightengine.com/pricing), [Sightengine docs](https://sightengine.com/docs).

## Payments

**No Eswatini merchant provider is verified.** DPO Pay by Network is a candidate to contact for written confirmation of onboarding, local bank settlement, supported currencies/cards, recurring-card tokens, and commercial rates; its current official supported-country page reviewed did not list Eswatini. PayPal's Eswatini consumer page does not establish local merchant receiving or recurring subscriptions. Stripe's published global availability list does not list Eswatini.

Defer live charges. Before implementation is activated, confirm the merchant route and determine whether CRUSH's benefits are digital in-app features subject to Apple/Google billing requirements. Hosted checkout and tokenization reduce card-data exposure but do not settle app-store policy, provider eligibility, or legal requirements.

Official references: [DPO payments](https://dpogroup.com/online-payments/), [DPO integration](https://dpogroup.com/integration/), [DPO recurring tokenization](https://docs.dpopay.com/dpo-pay-by-network/reference/recurring-payments-tokenisation-guide), [DPO FAQ](https://dpogroup.com/faq/), [Stripe global availability](https://stripe.com/global), [PayPal Eswatini](https://www.paypal.com/sz/home).

## Do not commit credentials

Provider secret keys, signing secrets, SMTP credentials, service-account files, APNs keys, and payment secrets must be stored in server-side secret management. Only explicitly public client values may be included in the mobile environment. Do not commit `.env` files. Provider selection and documentation do not make the app production-ready; see [`SECURITY.md`](SECURITY.md) and [`IMPLEMENTATION_ROADMAP.md`](IMPLEMENTATION_ROADMAP.md).
