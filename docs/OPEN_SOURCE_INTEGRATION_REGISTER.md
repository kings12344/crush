# CRUSH open-source integration register

This register tracks the repositories and libraries reviewed as references for CRUSH. It is deliberately **not** a list of code copied into CRUSH. CRUSH remains an Expo SDK 58 + React Native + TypeScript + Supabase application. Importing another complete app would replace or conflict with its authentication, database, routing, privacy controls and build system.

## Integration rules

- Keep Supabase as the only application backend. Do not add MongoDB, Clerk, Appwrite, Firebase or AWS Amplify to solve features CRUSH already handles with Supabase.
- Port small, isolated UI or algorithm patterns only after checking the source licence, Expo/RN compatibility, security and accessibility.
- Do not copy user data models or authorization logic from another backend. Reimplement the behavior against CRUSH's RLS-protected schema and actor-bound RPCs.
- Never copy OrkaChat's encryption implementation into production without an independent cryptographic review. Its README explicitly says the project has not been independently security-audited.
- Keep age (18+) and UNESWA student verification as hard server-side gates. Keep block checks, report rate limits, Secret Crush anonymity and match-only messaging.
- Do not copy code from repositories with no clearly declared open-source licence. Read the current licence in each source repository before any code reuse.

## Source repositories and CRUSH mapping

| Source | Useful patterns to study | CRUSH integration decision |
|---|---|---|
| [xMind](https://github.com/aashir-athar/xmind-app) | Cursor pagination, optimistic UI, deterministic feed ranking, search UX, chat delivery patterns | Use as a design reference. Its MongoDB + Clerk backend is not compatible with CRUSH. No backend code imported. |
| [OrkaChat](https://github.com/PROJXON/OrkaChat) | Message reactions, replies, typing indicators, read receipts, attachment UX, block/report flows | Port UI patterns selectively. Keep CRUSH's Supabase authorization. Do not reuse its unaudited E2EE implementation. |
| [Humbble](https://github.com/Prakashchandra-007/humbble) | Dating discovery, swipe interactions, match-oriented flows | Reference only; its Appwrite backend and older Expo/RN versions are not adopted. Rebuild interactions on CRUSH RPCs. |
| [react-native-chat](https://github.com/kesha-antonov/react-native-chat) | Accessible chat composer, bubbles, replies, reactions, media rendering and theming | Candidate UI package for a later messaging implementation. Add only after a compatibility spike against React Native 0.88 / Expo 58 and CRUSH message data. |
| [Social Media Chat Mobile App](https://github.com/Pro-Max-Park/social-media-chat-mobile-app) | Supabase Storage, post/media workflows, comments, realtime feed and pagination | Closest backend reference. CRUSH already has a Supabase public text feed and comments; media publishing, Storage policies and moderation must be designed specifically for CRUSH before adding uploads. |
| [Surakshak](https://github.com/surakshak-redx-org/app) | Community safety, report flows, moderation concepts, E2E testing and incident UX | Safety patterns only. Its README states all rights reserved; do not copy its source code. Its Firebase backend and emergency/location features are not imported. |
| [Bluesky Social App](https://github.com/bluesky-social/social-app) | Feed composition, content interactions, accessibility and moderation UX | Architecture/UI reference only; do not adopt its AT Protocol stack. |
| [Rocket.Chat React Native](https://github.com/RocketChat/Rocket.Chat.ReactNative) | Mature messaging interaction patterns and mobile chat UX | Reference only; do not introduce its server/backend stack into CRUSH. |
| [Expo Image Picker](https://github.com/expo/expo/tree/main/packages/expo-image-picker) | Native photo/video selection and permission handling | Official Expo package candidate for a future media composer. Add through `npx expo install expo-image-picker` for the project's SDK version, then enforce file type/size checks and private Storage policies. |
| [Lucide](https://github.com/lucide-icons/lucide) | Consistent accessible icon set | Already integrated on the CRUSH feature branch using `lucide-react-native` and `react-native-svg`. |

## What CRUSH already has

The current feature branch already contains its own Supabase implementations for:
- Authenticated discovery and mutual matching RPCs, with age/student verification and visibility checks.
- Like and Secret Crush flows, with sender anonymity until a mutual match.
- Actor-bound block/unblock RPCs and report submission with server-side rate limiting.
- A public text community feed and comments, with verification checks before commenting.
- A Reels/community screen that reads the public feed and comments.

These are CRUSH implementations, not code copied from the references above. The feed is currently read-only for publishing; do not describe media uploads, full moderation tooling, a finished chat UI, or a production verification process as complete.

## Recommended integration sequence

1. **Messaging UI spike:** evaluate `@kesha-antonov/react-native-chat` in an isolated branch. Verify peer dependencies, bundle size, keyboard behavior, Expo SDK 58 compatibility, accessibility, and message/reply/reaction rendering. Do not replace the current Supabase message schema.
2. **Messaging backend completion:** implement conversation list, message history, send, realtime subscription, read state and block enforcement with Supabase RLS/RPCs. Test with two independent verified accounts before enabling the UI.
3. **Community publishing:** add a server-side create-post flow, then media selection using the official Expo Image Picker package. Add private Storage buckets, signed access, strict MIME/size limits, deletion and report/moderation workflows before user uploads.
4. **Feed quality:** introduce cursor pagination first. Consider deterministic ranking and diversity only after CRUSH has meaningful, consented interaction signals; do not infer sensitive traits or expose private activity.
5. **Safety and QA:** implement a review queue and moderator-only actions; add automated tests for block/report behavior, age/student gates, access isolation and account deletion. Use E2E patterns as inspiration, not copied emergency functionality.

## Licence and provenance notes

- OrkaChat and Humbble declare MIT; react-native-chat declares MIT.
- The xMind and Pro-Max-Park repository metadata did not expose a declared licence during this review. Treat their code as reference-only until a licence is confirmed in the repository.
- Surakshak's README states “Private — all rights reserved.” Do not copy its code.
- A repository being public does not automatically grant permission to reuse its source code.

Reviewed on 2026-11-15. Re-check each upstream repository's current code, licence and release compatibility before implementing a dependency or port.
