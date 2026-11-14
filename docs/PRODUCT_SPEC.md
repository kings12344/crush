# CRUSH Product Specification

## Launch
UNESWA Kwaluseni, Eswatini. Expand to other universities after validation.

## Audience and safety
Strictly 18+. Student verification should be implemented with private document storage and manual review or institution-supported verification.

## Core product
Dating discovery, friendship discovery, anonymous Secret Crush with mutual reveal only, matches, private messaging, Reels-style short videos, follows, campus events and 1:1 audio/video calls.

## Navigation
Discover, Reels, Matches, Inbox, Profile. Events and settings are secondary destinations.

## Privacy invariants
- Never expose unmatched Secret Crush senders, including in notifications, APIs, premium features or ordinary admin screens.
- Only authorized mutual connections may message or call.
- Block and unmatch restrictions must be enforced server-side.
- No precise live location.
- Private verification records are not public profile data.
- Calls are not recorded by default.

## Release sequence
1. Auth, age gate, student verification, profiles, discovery, matching, messaging, safety.
2. Reels uploads, transcoding, playback, comments and moderation.
3. Audio/video calls.
4. Events.
5. Payments and premium.
6. Multi-country expansion.
