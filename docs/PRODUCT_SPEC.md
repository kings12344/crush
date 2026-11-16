# CRUSH Product Specification

## Launch audience
CRUSH is exclusively for current University of Eswatini (UNESWA) students aged 18 and above. The initial campus rollout is Kwaluseni. Non-UNESWA users and users under 18 are not eligible.

## Eligibility and safety
- Both requirements are mandatory: trusted 18+ age assurance and trusted current UNESWA student-status verification.
- Both outcomes must be confirmed server-side. Client-entered birth dates, checkboxes, email domains, student numbers or editable metadata must never grant access.
- New accounts remain hidden and pending until both trusted checks are verified.
- Verification failures, unknown states and unavailable providers fail closed.
- Store only the minimum status and provider reference required. Do not collect identity documents or student evidence directly in the mobile client.

## Core product
Dating discovery, friendship discovery, anonymous Secret Crush with mutual reveal only, matches, private messaging, Reels-style short videos, follows, community posts, campus events and 1:1 audio/video calls.

## Navigation
Discover, Reels, Matches, Inbox, Profile. Events and settings are secondary destinations.

## Privacy invariants
- Never expose unmatched Secret Crush senders, including in notifications, APIs, premium features or ordinary admin screens.
- Only accounts verified for both age and current UNESWA student status may discover, match, message or participate in community features.
- Only authorized mutual connections may message or call.
- Block and unmatch restrictions must be enforced server-side.
- No precise live location.
- Private age- and student-verification records are not public profile data.
- Calls are not recorded by default.
- Reports and blocking remain available as safety controls while an account is pending verification.

## Release sequence
1. Trusted age and UNESWA student verification, profiles, discovery, matching, messaging and safety.
2. Moderation operations, account rights and privacy/retention controls.
3. Reels uploads, transcoding, playback and media moderation.
4. Audio/video calls and events.
5. Payments and premium only after Eswatini merchant and app-store policy checks.
