# CRUSH Security Review Log

Last reviewed: 17 November 2026
Scope: repository source and workflow review, Supabase schema/catalog inspection, Storage policies, and targeted GitHub secret-pattern searches.

## Threat model snapshot

### Assets
- Supabase Auth identities, email addresses, PKCE tokens and native sessions
- Trusted 18+ age-verification outcomes, current UNESWA student-status outcomes and any provider evidence
- Private profile photos, private match conversations and messages
- Like and Secret Crush relationships, especially unmatched sender identities
- Community posts/comments, reports, moderator notes and block relationships
- Supabase credentials and GitHub Actions build/release integrity

### Trust boundaries
1. The mobile client is untrusted. Client-side checks never grant eligibility or authorize another user's data.
2. Supabase Auth establishes the caller identity; database functions must derive the actor from `auth.uid()`.
3. Public-schema tables are protected by RLS and least-privilege grants. Sensitive writes and narrow read operations use reviewed RPCs.
4. The `private` schema holds verification and rate-limit state and must remain inaccessible to anon/authenticated table access.
5. Supabase Storage is private; object paths and policies must bind access to the authenticated owner.
6. GitHub Actions builds are untrusted inputs until dependency, type, configuration and artifact checks pass.

### Main abuse cases to keep testing
- Broken object-level authorization and user-ID spoofing
- Bypassing age or UNESWA student verification, or unlocking app tabs through client state
- Reading/sending messages after a block or match revocation
- Revealing unmatched Secret Crush senders
- Community-feed visibility bypass around block relationships
- Rate-limit evasion, spam, oversized payloads and unsafe media uploads
- Credential leakage, dependency compromise and unsafe CI artifact/release handling

## Prioritized findings

| ID | Severity | Finding and evidence | Remediation | Status |
|---|---|---|---|---|
| CR-001 | High if unintended | GitHub reports `kings12344/crush` visibility as **public** (`private=false`), despite the project brief describing it as private. | Repository owner should confirm intended visibility and change the GitHub repository setting if source confidentiality is required. No visibility change was made by this automation. | Open — owner decision |
| CR-002 | Medium | The deployed `get_public_feed` RPC filtered community comments for blocks but did not filter blocked post authors, and its comment count included comments from blocked authors. | Added migration `20261116000000_block_aware_community_feed.sql` to `feat/production-readiness`; added four pgTAP catalog assertions. | Committed to PR branch; **not applied to hosted database**; behavior tests pending |
| CR-003 | Medium | `.env.example` and the production-readiness branch's Android workflow used a malformed publishable-key prefix (`sb_publishable-p...`), while the app validator requires `sb_publishable_`. | Replaced with the active Supabase publishable key returned by the connected project and added a CI prefix guard. The key is a client publishable key, not a service-role secret. | Committed to PR branch; CI rerun pending |
| CR-004 | Medium | The PR branch's `package-lock.json` omits five direct dependencies (`lucide-react-native`, `react-native-svg`, `@kesha-antonov/react-native-chat`, `react-native-gesture-handler`, `react-native-keyboard-controller`) and locks `react-native-worklets` at `0.13.0` while package.json requests `~0.13.1`. CI currently runs `npm install` and uploads a refreshed artifact instead of using a synchronized committed lockfile. | Refresh and commit `package-lock.json`, then return CI to `npm ci`. Avoid relying on a generated artifact as the permanent lockfile. | Open |
| CR-005 | Medium | No Auth users or profiles exist in the hosted project, so two-account authorization, block bypass, messaging and match behavior have not been exercised end-to-end. | Create controlled test accounts in a non-production test environment and run the documented adversarial scenarios. | Open — test environment/data required |
| CR-006 | Medium | No trusted 18+ age-assurance provider or University-approved current-student verification process is connected; all new accounts must remain pending until both are verified. | Select lawful age and University-approved student-verification providers/processes and verify signed server-to-server results. Never accept a client-supplied verified flag or student number as proof. | Open — provider decision/integration |
| CR-007 | Medium | Report review queue, moderator operations, account deletion/export and retention workflows remain incomplete. | Implement least-privilege moderation and account-rights operations with audit trails and tests before public launch. | Open |
| CR-008 | Low / Info | Supabase Advisor reports three RLS-enabled tables without policies: `private.action_rate_limits`, `public.community_posts`, and `public.community_comments`. | Retain default-deny. Direct client table grants are absent; narrow RPCs are the intended access path. Do not add permissive policies just to silence the linter. | Reviewed — intentional |
| CR-009 | Info | Supabase Advisor reports 13 authenticated SECURITY DEFINER RPC warnings. Catalog inspection found empty `search_path` on the inspected functions and no anon EXECUTE grants. | Keep every function explicitly actor-bound and fully qualified; add authorization tests whenever an RPC changes. | Reviewed at catalog level; behavioral coverage incomplete |
| CR-010 | Info | Supabase Performance Advisor reports 12 unused indexes on a new, near-zero-traffic project. | Do not drop them without representative query plans and workload evidence. | Monitored |
| CR-012 | Medium | Registration passed raw Supabase Auth errors to the user, which could reveal account existence or internal failure details; Google OAuth screens also surfaced raw provider errors. | Replaced registration and OAuth error details with generic user-facing messages; aligned registration/login copy with 18+ and UNESWA student eligibility. | Committed to PR branch; CI pending |
| CR-013 | Medium | Hosted RLS policies on `matches` and `conversations` allowed participant SELECT without checking that both participants remained verified or unblocked. Message reads were guarded, but relationship metadata could still be queried after eligibility loss or a block. | PR #8 adds `private.is_match_available`, makes the conversation guard delegate to it, and replaces both SELECT policies. The helper is actor-bound, SECURITY DEFINER with an empty search path, and checks age, current UNESWA student status and both block directions. Added pgTAP catalog assertions for the helper and policies. | Committed to PR #8; local database CI pending; hosted database unchanged |
| CR-014 | Medium | Community feed and comment RPCs checked the viewer's eligibility but did not consistently filter post/comment authors whose age or UNESWA student status had become pending or revoked. Existing content could remain visible after an author's eligibility loss. | PR #8 joins private verification records for post and comment authors, filters feed posts/comment counts/comment lists to currently eligible authors, and rejects comments on posts by ineligible authors. Added four catalog assertions and nine synthetic behavioral assertions using rolled-back test users. | Committed to PR #8; expanded local database CI pending; hosted database unchanged |

## Verified controls observed in the hosted project on 17 November 2026

- All 12 public application tables have RLS enabled.
- Private verification and rate-limit tables have no direct client table access; the verification table has an explicit deny policy for anon/authenticated.
- Community post/comment tables have no anon or authenticated direct SELECT grants; RPCs are the access path.
- Message direct SELECT is granted only to authenticated users and is constrained by the private conversation guard; anon has no SELECT grant.
- The hosted project is still on the age-only schema. Its current match and conversation SELECT policies are participant-only and do not yet enforce current verification or block status. This is recorded as CR-013; do not treat the PR #8 fix as live.
- On the PR #8 branch, `private.is_match_available` checks both participants' age and current UNESWA student status plus both block directions; the conversation helper delegates to it. New RLS policies use those helpers for matches and conversations. These branch changes are not applied to the hosted database.
- Inspected SECURITY DEFINER functions pin an empty `search_path`; the new PR #8 helpers deny anon EXECUTE and grant only authenticated EXECUTE.
- The `profile-photos` bucket is private, has a 5 MiB limit and permits JPEG, PNG and WebP. Storage object policies scope operations to the authenticated user's folder.
- Targeted GitHub searches for `SUPABASE_SERVICE_ROLE_KEY` and `service_role` returned no matches. This is a targeted search, not a complete historical secret scan.
- The current npm audit reports three moderate findings associated with the same minimatch advisory in Expo build tooling; this is not three separate advisories. Expo maintainers have assessed the affected use as not exploitable through app inputs.

## Release gate

- [ ] Confirm GitHub repository visibility is intentional.
- [ ] Commit the refreshed package lockfile and restore deterministic `npm ci`.
- [ ] Run the expanded 62 catalog + 9 synthetic community-author behavioral pgTAP assertions in a local/test database; add two-account behavioral tests for discovery, matching, messaging and blocks.
- [ ] Run two-account tests for discovery, likes, Secret Crush, conversations, messages, comments and blocks.
- [ ] Integrate trusted age assurance and University-approved student verification with signed server callbacks.
- [ ] Verify Auth redirect allowlist and production SMTP.
- [ ] Complete moderation queue, account deletion/export, retention and incident-response procedures.
- [ ] Complete physical Android/iOS tests for SecureStore, deep links, logout, foreground refresh, network failures and accessibility.
- [ ] Complete dependency, static-analysis, secret-history and mobile security reviews.

This is a focused engineering review, not a full penetration test or production security certification. The hosted project has no user accounts, and the new block-aware feed migration is not deployed.


## Eligibility correction — 17 November 2026

The product audience is confirmed as current UNESWA students aged 18+. The production-readiness branch had removed student eligibility from the app and live database. A follow-up branch restores private `student_status` and `student_provider_ref` columns, adds an authenticated own-status RPC, and re-enforces both statuses in discovery, matching, messaging and community operations. The migration is additive and remains unapplied to the hosted database pending test review and production approval. PR #8 also closes CR-013 on its branch by gating match/conversation metadata reads.

Both trusted integrations are still missing. All new accounts must remain hidden and pending. Do not use an email-domain check, student-number form, checkbox or manual client flag as a substitute for institutional verification.


## Local database test execution — 17 November 2026

A repository workflow now initializes a disposable local Supabase stack and runs `supabase test db` without hosted-project credentials. The 58-assertion suite passed in run 43974165522 (58 tests, zero failures); the disposable stack applied all migrations successfully. Earlier runs exposed two formatting-sensitive block-filter assertions and one stale conversation-helper assertion after refactoring; those expectations were corrected. A rerun for the latest documentation-only branch head is in progress. No hosted migration was applied.


## Community author eligibility review — 17 November 2026

CR-014 was identified while reviewing the restored UNESWA-only community path. The viewer's age and student status were checked, but the earlier PR #8 implementation did not also filter post and comment authors whose eligibility had subsequently changed. This was a branch-level finding; the hosted database has no users and the fix has not been deployed.

The PR #8 migration now:
- Requires current age and student verification for post authors before returning their posts.
- Counts only comments whose authors remain verified.
- Requires both the post author and comment author to remain verified before returning comments.
- Rejects comment creation against a post whose author is no longer eligible.
- Preserves bidirectional block filtering.

Four catalog assertions and nine synthetic behavioral assertions were added. The behavioral test inserts two synthetic Auth users, profiles, posts and comments; it checks pending/verified transitions and rolls back all test data. The expanded CI run is pending, so CR-014 is not marked verified yet.
