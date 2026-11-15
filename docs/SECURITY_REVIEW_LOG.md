# CRUSH Security Review Log

Last reviewed: 16 November 2026
Scope: repository source and workflow review, Supabase schema/catalog inspection, Storage policies, and targeted GitHub secret-pattern searches.

## Threat model snapshot

### Assets
- Supabase Auth identities, email addresses, PKCE tokens and native sessions
- Trusted 18+ age-verification outcomes and any provider evidence
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
- Bypassing age verification or unlocking app tabs through client state
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
| CR-004 | Medium | The PR branch's `package.json` and `package-lock.json` root dependency declarations are out of sync. CI currently runs `npm install` and uploads a refreshed lockfile artifact rather than installing from a committed, synchronized lockfile. | Refresh and commit `package-lock.json`, then return CI to `npm ci`. Avoid relying on a generated artifact as the permanent lockfile. | Open |
| CR-005 | Medium | No Auth users or profiles exist in the hosted project, so two-account authorization, block bypass, messaging and match behavior have not been exercised end-to-end. | Create controlled test accounts in a non-production test environment and run the documented adversarial scenarios. | Open — test environment/data required |
| CR-006 | Medium | No trusted 18+ age-assurance provider or signed server callback is connected; all new accounts must remain pending. | Select a lawful provider and verify signed server-to-server results. Never accept a client-supplied verified flag. | Open — provider decision/integration |
| CR-007 | Medium | Report review queue, moderator operations, account deletion/export and retention workflows remain incomplete. | Implement least-privilege moderation and account-rights operations with audit trails and tests before public launch. | Open |
| CR-008 | Low / Info | Supabase Advisor reports three RLS-enabled tables without policies: `private.action_rate_limits`, `public.community_posts`, and `public.community_comments`. | Retain default-deny. Direct client table grants are absent; narrow RPCs are the intended access path. Do not add permissive policies just to silence the linter. | Reviewed — intentional |
| CR-009 | Info | Supabase Advisor reports 13 authenticated SECURITY DEFINER RPC warnings. Catalog inspection found empty `search_path` on the inspected functions and no anon EXECUTE grants. | Keep every function explicitly actor-bound and fully qualified; add authorization tests whenever an RPC changes. | Reviewed at catalog level; behavioral coverage incomplete |
| CR-010 | Info | Supabase Performance Advisor reports 12 unused indexes on a new, near-zero-traffic project. | Do not drop them without representative query plans and workload evidence. | Monitored |

## Verified controls observed on 16 November 2026

- All 12 public application tables have RLS enabled.
- Private verification and rate-limit tables have no direct client table access.
- Community post/comment tables have no anon or authenticated direct SELECT grants; RPCs are the access path.
- Message direct SELECT is granted only to authenticated users and is further constrained by an RLS policy calling the private conversation guard; anon has no SELECT grant.
- The private conversation guard checks caller membership, both users' age-verification status and both directions of blocks.
- Inspected SECURITY DEFINER functions pin an empty `search_path`; none of the inspected functions is executable by anon.
- The `profile-photos` bucket is private, has a 5 MiB limit and permits JPEG, PNG and WebP. Storage object policies scope operations to the authenticated user's folder.
- Targeted GitHub searches for `SUPABASE_SERVICE_ROLE_KEY` and `service_role` returned no matches. This is a targeted search, not a complete historical secret scan.

## Release gate

- [ ] Confirm GitHub repository visibility is intentional.
- [ ] Commit the refreshed package lockfile and restore deterministic `npm ci`.
- [ ] Run the expanded pgTAP suite in a local/test database.
- [ ] Run two-account tests for discovery, likes, Secret Crush, conversations, messages, comments and blocks.
- [ ] Integrate trusted age assurance with signed server callbacks.
- [ ] Verify Auth redirect allowlist and production SMTP.
- [ ] Complete moderation queue, account deletion/export, retention and incident-response procedures.
- [ ] Complete physical Android/iOS tests for SecureStore, deep links, logout, foreground refresh, network failures and accessibility.
- [ ] Complete dependency, static-analysis, secret-history and mobile security reviews.

This is a focused engineering review, not a full penetration test or production security certification. The hosted project has no user accounts, and the new block-aware feed migration is not deployed.
