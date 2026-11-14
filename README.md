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

This is a **frontend prototype, not a production app**. No real authentication, server/API, account persistence, matching, chat delivery, verification upload, moderation, payments, or calls exist. Do not enter real credentials or personal documents. All sample profiles and preview interactions are fictitious/local-only. Four non-sensitive privacy-preview values can be saved on this device, but they do not affect a CRUSH account or server. Client-side validation is not security enforcement. The Expo SDK 58 dependency audit still reports 3 moderate advisories (no high or critical findings); see [`docs/SECURITY.md`](docs/SECURITY.md). TypeScript, Expo Doctor (20/20), dependency alignment, Expo config generation, and web export pass, but iOS/Android builds and device-only flows have not been validated. Production release remains blocked.

Implementation gaps and stages are tracked in [`docs/IMPLEMENTATION_ROADMAP.md`](docs/IMPLEMENTATION_ROADMAP.md). Provider options and unresolved Eswatini availability checks are in [`docs/PROVIDER_DECISIONS.md`](docs/PROVIDER_DECISIONS.md). The additive SQL in `database/migrations/` is a **draft data model only**; it has not been applied or connected to an API.

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
- Added device-only persistence for non-sensitive privacy-preview switches and a dedicated Safety Center; the switches do not update any account or enforce privacy.
- Hardened database reference schema with external identity-provider subject IDs, input constraints, indexes, and explicit privacy/authorization notes.

These upgrades improve the prototype and its security posture documentation; they do not establish that CRUSH is secure for production. See [`docs/SECURITY.md`](docs/SECURITY.md) for the launch gate.
