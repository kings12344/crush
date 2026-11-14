# CRUSH Mobile App — Development Starter

CRUSH is a student social discovery app for users aged 18+, initially planned for UNESWA Kwaluseni.

## Stack

- React Native + Expo + TypeScript
- Expo Router
- Backend target: Node.js + NestJS; PostgreSQL; WebSockets for realtime messaging
- Video hosting/calls: provider decision and implementation pending

## Run locally

1. Install Node.js LTS.
2. Run `npm install`.
3. Run `npm run typecheck`.
4. Run `npx expo start` and launch on a simulator/device.

## Current status and security warning

This is a **frontend prototype, not a production app**. No real authentication, server, persistence, matching, chat delivery, verification upload, moderation, payments, or calls exist. Do not enter real credentials or personal documents. All sample profiles and preview interactions are fictitious/local-only. Client-side validation is not security enforcement. Dependency audit is also unresolved: 17 advisories (including 5 high) remain in the current SDK dependency tree; see [`docs/SECURITY.md`](docs/SECURITY.md). Production release is blocked pending a tested SDK migration and clean audit.

Before inviting real users, implement and independently test the backend authorization, provider-backed login and session security, age/student verification, privacy controls, blocking/report moderation, secure media handling, deletion/export, and operational response requirements in [`docs/SECURITY.md`](docs/SECURITY.md). The SQL file is a design reference and should not be run against production without a reviewed migration plan.

## Product and privacy rules

- Strictly 18+; enforce eligibility on trusted services, not only the client.
- Keep legal identity and student verification documents private and minimize retention.
- Unmatched Secret Crush senders must never be revealed.
- Only eligible, mutually matched users can use dating chat and calls; block state overrides matching.
- No precise live location.
- Never present mock data as real users, moderation, or transactions.

## V3 prototype upgrades

- Stronger registration UX (email normalization/format, real-date and age checks, password confirmation and policy); login warnings against real credentials.
- Interactive discovery modes, local-only pass/like preview, and report/hide preview actions.
- Illustrative privacy switches and a dedicated Safety Center.
- Hardened database reference schema with external identity-provider subject IDs, input constraints, indexes, and explicit privacy/authorization notes.

These upgrades improve the prototype and its security posture documentation; they do not establish that CRUSH is secure for production. See [`docs/SECURITY.md`](docs/SECURITY.md) for the launch gate.
