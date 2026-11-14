# Changelog

## V3 — Security and product upgrade
- Tightened registration UX: normalized email, robust calendar-date validation, 18+ check, stronger password policy, confirmation field, native autofill/content hints, and explicit no-backend/no-real-credentials warning.
- Clarified that login and password reset are unavailable and do not send or save credentials.
- Added interactive discovery preview controls and report/hide affordance, while explicitly labeling all actions as local-only.
- Added illustrative profile privacy switches and a Safety Center with boundaries, safer-meetup guidance, blocking/reporting expectations, and prototype limitations.
- Reworked SQL design to delegate credentials to a managed identity provider; added data validation, foreign-key behavior, indexes, reporting categories, and authorization prerequisites.
- Added a production security baseline and launch checklist; updated README to state the app is not production-ready.

## V2 — Auth and verification journey UI
- Added welcome, registration, login and student verification screens.
- Added client-side date-of-birth validation and 18+ confirmation.
- Added explicit demo-only warnings so users are not misled into thinking accounts are created.
- Updated app entry route to the welcome screen.

Production authentication and verification services are still not connected.

## V1
- Initial Expo navigation, sample discovery, reels, matches, inbox and profile screens.
