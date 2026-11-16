# CRUSH Development Log

## Session 2 — 16 November 2026

### Product Engineer
- Replaced raw Supabase registration and Google OAuth error messages with generic user-facing responses to reduce account enumeration and backend/provider detail disclosure.
- Corrected registration and login eligibility copy to match the current age-only branch behavior.
- Added network-failure handling to email-confirmation and password-reset flows so rejected requests do not leave the UI indefinitely loading or the password button stuck busy.
- Connected the Matches tab to the existing guarded get_my_conversations RPC. It now shows active mutual matches, a useful empty/error state and a direct route into the private chat screen.
- Updated Matches and Inbox to refresh when their tabs regain focus, preventing stale match/conversation lists after new activity.
- Kept the existing PKCE and SecureStore session design unchanged.

### Cybersecurity Engineer
- Reviewed hosted Supabase RLS, grants, SECURITY DEFINER functions, Storage bucket settings and Advisor findings using read-only queries.
- Confirmed all 12 public application tables have RLS enabled. Private verification/rate-limit state and community tables have no direct client table grants.
- Confirmed community tables have no direct anon/authenticated SELECT grants; message SELECT is authenticated-only and further restricted by the conversation-availability RLS guard.
- Confirmed the profile-photos bucket is private, limited to 5 MiB and JPEG/PNG/WebP, with owner-folder object policies.
- Catalog inspection found empty search_path on inspected SECURITY DEFINER functions and no anon EXECUTE grants. The 13 Advisor warnings still need behavioral testing; this is not a full audit.
- Found and fixed a community-feed block-visibility gap in a new migration: posts by accounts blocked in either direction are omitted, and visible comment counts exclude comments by blocked accounts. The migration is committed to this PR branch only and has not been applied to hosted Supabase.
- Expanded the pgTAP catalog suite from 29 to 33 assertions. It is committed but not run because pgTAP is not installed in the hosted project.
- Corrected the publishable-key prefix in .env.example and the Android debug workflow to match the active Supabase publishable key. Added a fail-fast CI prefix check.
- Pinned the five Android CI actions to verified commit SHAs and narrowed workflow triggers to main pushes, PRs targeting main and manual dispatch to reduce duplicate builds.

### Verification
- Read-only Supabase catalog and policy queries completed.
- Supabase Advisor returned 3 RLS-without-policy INFO notices (intentional default-deny), 13 authenticated SECURITY DEFINER WARN notices and 12 unused-index INFO notices.
- Previous Android debug APK run completed successfully on 15 November 2026 at 12:28 UTC; its dependency audit high threshold and TypeScript check passed and an APK artifact was uploaded.
- Latest PR debug and standalone release workflows for the current branch head were started. At the time of this log, both were still in progress; the Supabase key-prefix validation step passed in the debug workflow.
- No production database migration, live user record or deployment was changed.

### Outstanding blockers and decisions
- The repository currently reports as public, despite the project brief calling it private. No visibility change was made.
- The branch removes UNESWA student verification and changes CRUSH to an adults-18+ audience in Eswatini generally. Confirm that this product-scope change is intentional before merging.
- package.json and the committed package-lock.json remain out of sync. CI generates and uploads a refreshed lockfile artifact with npm install; the refreshed file still needs to be committed before returning to npm ci.
- A trusted 18+ provider and signed server callback are not connected. New accounts remain pending and discovery stays locked.
- Hosted Supabase currently has zero Auth users and zero profiles. Two-account and physical-device behavior tests remain outstanding.
- Moderation operations, account deletion/export, retention and incident-response workflows remain incomplete.
- PR #7 remains a draft and is not merged. The new community-feed migration is not deployed.

### Next priorities
1. Synchronize and commit package-lock.json, then restore deterministic npm ci.
2. Review current CI results and run the 33-assertion pgTAP suite in a local/test database.
3. Run controlled two-account tests for age gating, discovery, mutual matching, messaging, comments and both directions of blocks.
4. Complete account deletion/export, moderation and retention workflows.
5. Confirm repository visibility and the intended product audience before PR #7 is merged.
