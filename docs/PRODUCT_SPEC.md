# CRUSH Product Specification

## Launch
Initial launch in Eswatini, with University communities as a possible early audience. Enrollment verification is not an eligibility requirement.

## Audience and safety
Strictly 18+. Trusted age assurance is mandatory and must be confirmed server-side. Client-entered birth dates, checkboxes, email domains, or user-editable metadata must never grant access.

## Core product
Dating discovery, friendship discovery, anonymous Secret Crush with mutual reveal only, matches, private messaging, Reels-style short videos, follows, community posts, campus events and 1:1 audio/video calls.

## Navigation
Discover, Reels, Matches, Inbox, Profile. Events and settings are secondary destinations.

## Privacy invariants
- Never expose unmatched Secret Crush senders, including in notifications, APIs, premium features or ordinary admin screens.
- Only authorized mutual connections may message or call.
- Block and unmatch restrictions must be enforced server-side.
- No precise live location.
- Private age-assurance records are not public profile data.
- Calls are not recorded by default.
- Community posts, comments and other user-generated content are available only to authenticated, age-verified users.

## Release sequence
1. Auth, trusted age assurance, profiles, discovery, matching, messaging and safety.
2. Moderation operations, account rights and privacy/retention controls.
3. Reels uploads, transcoding, playback and media moderation.
4. Audio/video calls and events.
5. Payments and premium only after Eswatini merchant and app-store policy checks.
6. Multi-country expansion.
