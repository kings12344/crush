# CRUSH Architecture (Target)

## Mobile
React Native + Expo + TypeScript + Expo Router.

## Backend
Node.js + NestJS REST API; WebSockets for realtime messaging and presence. Enforce authorization in backend services.

## Data
PostgreSQL. Suggested modules: users, universities, campuses, verifications, profiles, interests, preferences, likes, secret_crushes, matches, conversations, messages, videos, video_interactions, follows, calls, events, registrations, subscriptions, payments, reports, blocks, notifications, audit_logs.

## Media
Use object storage for images and a dedicated video platform (e.g. Mux or Cloudflare Stream) for upload, transcoding and adaptive playback. Use signed URLs and access checks for private media.

## Calls
Integrate a WebRTC provider such as Daily, Agora or Twilio after testing availability, pricing and platform support. Issue short-lived tokens from the backend only after checking match and block status.

## Notifications
Push delivery through APNs and Firebase Cloud Messaging, plus in-app notification records.

## Admin
Separate Next.js admin portal with role-based access and audit logs.

## Deployment
Managed PostgreSQL, backend hosting, object storage, video provider and secrets manager. Do not put provider secrets in the mobile app.
