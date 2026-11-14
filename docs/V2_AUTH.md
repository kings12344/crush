# V2 — Registration, Login and Student Verification UI

Added:
- Welcome screen with registration and login navigation.
- Registration form with date-of-birth validation and an 18+ gate.
- Login screen placeholder.
- Student verification method selection and privacy explanation.

Important limitations:
- No account data is transmitted or stored.
- No password hashing, email verification, backend session or real authentication exists yet.
- Verification document upload and staff review are not connected.
- The age gate is client-side demonstration logic only. Production must enforce eligibility on the backend and apply appropriate age assurance.

Next engineering task:
Implement backend authentication (password hashing, email verification, refresh sessions, rate limits), then connect these screens to it. Do not store raw passwords on the device or in the database.
