# UNESWA eligibility integration and rollout

**Product rule:** CRUSH is exclusively for current University of Eswatini (UNESWA) students aged 18 and above, initially at Kwaluseni.

## Server-side eligibility contract

A user is eligible only when both private statuses equal `verified`:

- `age_status`: trusted 18+ age assurance.
- `student_status`: trusted current UNESWA student verification.

Both statuses default to `pending`. The mobile client can read only its own status through authenticated RPCs. It cannot write status, provider references, evidence or profile visibility. The private verification table remains inaccessible to anon/authenticated table queries.

The database enforces both checks for discovery, likes, Secret Crush, mutual-match conversations, message reads/writes and community feed/comment operations. Client-side navigation is an additional lock, never the authorization boundary. Report and block operations remain available as safety controls while verification is pending.

## Provider requirements

Before either integration is enabled:

1. Select an age-assurance provider and a University-approved way to confirm current student status.
2. Obtain written approval for the data fields, retention period, legal basis, user notice, correction process and dispute handling.
3. Use a server-to-server callback or a trusted operator workflow. Never trust a client-supplied `verified` flag, date of birth, student number, email domain or editable user metadata.
4. Verify callback signatures with the provider's published signing key/secret, validate timestamps, reject replayed event IDs, and make updates idempotent.
5. Bind every result to the correct Supabase Auth user using a server-created verification session. Do not accept arbitrary user IDs from a mobile request.
6. Store only the minimum status, provider reference, decision timestamp and audit metadata. Do not store raw identity documents or student records unless a separately approved legal/privacy assessment requires it.
7. Ensure rejected, expired, revoked, ambiguous and unavailable outcomes remain locked. A status downgrade must immediately revoke discovery and messaging access.

Provider secrets and Supabase service-role credentials must remain in a server-side secret manager. They must never be added to Expo public variables, Git, mobile builds or logs.

## Safe rollout order

- [ ] Approve both providers/processes and the privacy/retention design.
- [ ] Implement signed, replay-resistant server callbacks and audit logging.
- [ ] Test both verification paths using synthetic accounts in a separate test database.
- [ ] Review and execute the pending block-aware and eligibility-restoration migrations in the test database.
- [ ] Run the pgTAP catalog suite and two-account authorization tests for discovery, reciprocal likes, Secret Crush secrecy, conversations, messages, blocks, feed reads and comments.
- [ ] Test sign-up, email confirmation, session persistence, foreground refresh, network failures and logout on physical Android/iOS devices.
- [ ] Obtain production migration approval before applying pending migrations to the hosted CRUSH project.
- [ ] Re-check Supabase RLS, grants, function search paths, backups and Auth settings after migration.
- [ ] Only then consider a staged release.

## Current state

The hosted CRUSH database still has the previous age-only schema and no student-status columns. The additive restoration migration is on the feature branch and has not been applied. Neither trusted verification integration is connected. New accounts must remain hidden and pending; no manual bypass is permitted.

## Rollback principle

Do not drop the restored student-status columns as a rollback. If a provider or callback fails, fail closed and keep accounts pending or require review. Revert application code only together with a reviewed server-side policy that preserves the UNESWA-plus-18+ product rule.
