# SEP launch readiness — October 12, 2026

The core platform and MCP server are **deployed at https://www.ucsbsep.com**. Google OAuth remains in Testing; broader Google access is pending the user’s publication approval. The real Beta pledge roster is now imported; the confirmed program schedule still needs chapter setup. Do not invite the class based on a demo or a passing build.

## Roster update — October 12, 2026

- Imported the 20 final `yes` decisions from deliberation-board revision 101 as real `pledge` accounts with editable Beta class tags. Exact application source rows and names were matched to UCSB emails; phone, major and school year were imported. No photos, application essays, grades, deliberation notes or rejected applicants were added.
- Marked all 18 imported Alpha profiles Active and provisioned their accounts. At the user’s subsequent request, fully removed Charlie Martin and Bailey Barmaki from accounts, member profiles, current directory and archived entries, with Google/MCP access revoked. Both accounts were created during this import and had no process history. Private rollback snapshots remain; 16 of the imported Alpha accounts remain available in the process.
- Corrected the two existing login emails identified by the supplied roster, preserving account IDs and roles and revoking sessions for those corrected addresses.
- Verified through the production database and authenticated localhost view using that database: 20 Beta pledge cards, zero Beta photos, all 20 listed in coffee chats, no stale potential-new-member status labels, and all 40 original accounts retained. Private image storage remains at 57 assets. Google audience publication remains separate and pending.
- Private source match, guarded plans, backups and verification records are retained under `.private/beta-import/`. No code deployment, commit or push was required for this roster update.

## Academic-year refresh — October 12, 2026

At the user’s request, advanced returning members’ academic labels by one year: 17 Freshman → Sophomore, 18 Sophomore → Junior, and 17 Junior → Senior accounts. Updated 53 corresponding imported directory profiles. Preserved all 20 Beta pledge years from their current applications, fixed graduation years, alumni/blank fields, membership classes, account roles and identity IDs. Guarded plan, private backups and read-after-write verification are in `.private/year-rollover/`; do not rerun the rollover against the updated data.

## Verified today

- Post-promotion public verification: `/api/auth/config` returns 200 JSON with the configured Google client and preview disabled; both OAuth discovery endpoints return 200 JSON; unauthenticated `/api/process` returns 401; `/privacy` returns 200 HTML. The MCP chat separately reports all seven canonical `pnpm check:mcp` checks passing. Actual ChatGPT/Claude account connections remain unverified.
- Hosting ownership is now verified: `sepexecs-projects/sep-rush26` (`prj_CBIRYS9VALmN2BAg4jqPUOO6qKCm`) serves both `ucsbsep.com` and `www.ucsbsep.com`. The user authorized chapter CLI access; its isolated config is `/Users/piam/.config/vercel-sep`, keeping the other account separate. This checkout is linked to the verified project.
- The verified production host has an existing reachable `DATABASE_URL` and legacy `JWT_SECRET`. Its configuration was downloaded to ignored, mode-600 `.private/vercel-production.env`. Google client ID and private-directory storage are now configured. Canonical origin and MCP enablement are present; SMS remains disabled pending separate setup.
- Read-only production inspection found 40 accounts (29 active, 8 exec, 3 admin), 39 with school-domain emails, and a profile for every account. No pledge or pledge-master roles exist yet. Two existing admin accounts have school emails. The chapter executive account `exec@ucsbsep.org` is the third existing administrator; user instruction explicitly authorizes this Google login for pledge-master access. Its admin role already includes process oversight. Real executive Google sign-in was verified against this database through the localhost verification server; canonical-domain sign-in still needs verification.
- The additive production schema is installed. All 56 private directory profiles and 57 photos are published to the database; existing account IDs/roles and member history were preserved.
- `pnpm publish:directory --apply` completed; direct database checks confirm 56 private directory profiles and 57 JPEGs (24.6 MB).
- The sample activity is fictional. A real calendar and deliverables still need chapter review; importing the directory does not approve those people for member access.

- Final local validation: 172 tests across 30 files, TypeScript, production build, and `git diff --check` passed. The build retains a non-fatal 500 kB chunk warning. These checks do not establish live readiness.

- Google Cloud project `UCSB SEP Member Platform` (`peak-castle-511502-i0`) was created under `ucsbsep.org`. The user approved Google policy acceptance. Branding, External audience, and Web client `735583633563-122a1mu9boqqie1cd4poq1n949tnfbp2.apps.googleusercontent.com` are created. It remains in Testing with `exec@ucsbsep.org` as a test user; public audience publication is pending.
- A private consistent row snapshot of all 10 existing production tables was saved under `.private/backups/` before any migration. This snapshot contains data, not a schema/provider-level backup. Subsequent writes added schema/private directory data and an authentic Google session; no existing member role was changed.

- Promoted deployment: `https://sep-rush26-mbs529hih-sepexecs-projects.vercel.app` (`dpl_2VM1ZfeQAeVSvTdKNZnkFkxbZWKS`). Hosted checks pass: Google config 200 JSON; OAuth and protected-resource metadata 200 JSON; process/MCP unsigned requests 401 JSON; malformed authorize/token requests 400 JSON. Serverless build now has no TypeScript errors. Public domain promotion was completed by the MCP chat. Google OAuth publication still awaits the user’s final approval.
- Real Google sign-in for `exec@ucsbsep.org` passed against the production database through the localhost verification server. It reached the pledge-master overview; SQL confirms the original admin account is Google-bound with an active session.
- Staged Vercel verification found extensionless server imports that fail in native Node ESM. Those imports are corrected; native unbundled API import and the full tests pass. Added a direct Express core type dependency to resolve Vercel-only type-resolution diagnostics.

## Changes made to remove implementation blockers

Private profile metadata and images can now be stored in the existing Neon database. Production reads that store by default. The authenticated image routes retain member access checks, `private, no-store`, and `nosniff`; private assets are not bundled into the public site or deployment source. Publication validates all references and uploads assets before switching the active directory. Previous directory versions are retained. It does not import Notion roles, create accounts, or replace edited profiles.

Use the reviewed roster provisioning workflow in `PRODUCTION-ROSTER-SETUP.md`. Do not use the old `seed:founding` script to provision platform access: its legacy account roles/classes do not represent the new platform roster.

Administrator email/role changes now revoke both Google and MCP sessions atomically. Removal archives accounts while retaining history; the admin UI includes archived-member filtering and restoration. Legacy directory queries exclude archived accounts, and pledge profile detail requests retain contact privacy. Roster provisioning requires an explicit reviewed plan and preserves existing IDs.

## Required launch sequence

1. **Confirm the hosting project.** Sign into the chapter's Vercel account, identify the project whose production domain is `www.ucsbsep.com`, and confirm that exact owner/project before configuring or deploying. A similarly named project in another account is insufficient.
2. **Connect the database.** Preserve the current database and take a backup or isolated branch before applying the additive schema or roster plan. Set `DATABASE_URL` only on the server/verified host.
3. **Configure Google sign-in.** Follow `GOOGLE-LOGIN-SETUP.md`. Set the Google Web client ID and canonical HTTPS `APP_ORIGIN`. Both UCSB domains and the specific chapter executive account are accepted; each exact verified Google email must exist on the roster. Verify the existing executive administrator can sign in.
4. **Review and apply the real roster.** Use the dry-run-first provisioning command. Preserve existing IDs. Explicitly approve staff/pledge-master/admin assignments. Never infer access from a Notion role, photo, or email domain alone.
5. **Publish private directory data.** Run `pnpm publish:directory` first. With the correct database explicitly configured and backed up, run `pnpm publish:directory --apply`. Set `MEMBER_IMPORT_STORAGE=database`. Originals/exports remain local.
6. **Deploy the prepared changes to the confirmed project.** The verified production-environment deployment was staged with `--skip-domain` and has now been promoted onto the public domain. No commit/push was performed. A Git push requires the user's explicit push instruction. Recheck the public homepage, Login button, and direct dashboard routes.
7. **Verify real member workflows.** Use real test accounts for a pledge, active and pledge master. Complete one coffee log → active confirmation; strike report → master approval/dismissal; assigned makeup → owner verification → master credit; deliverable submission → review; private question → master response. Verify a second device sees saved updates, and unauthorized accounts cannot read private records or act for someone else.
8. **Confirm the actual program.** Pledge masters set the cohort name/dates, schedule, deadlines, deliverables and requirements. Do not copy fictional demo activity into production.
9. **Connect assistants.** Enable `MCP_ENABLED=true`, run `pnpm check:mcp https://www.ucsbsep.com`, then independently sign into ChatGPT and Claude through SEP OAuth and verify identity, a read, and a permitted update in each. Local MCP tests cannot establish remote connectivity.
10. **Activate incoming texts.** Follow `SMS-SETUP.md` using the chapter-owned number/Gmail and AI billing key. Verify a real Google Voice notification, sender binding, duplicate delivery, ambiguous text handling and pending-master-review behavior before installing the five-minute job. The free-number/email-forwarding chain is still unverified end to end.

## Commands and evidence boundaries

- `pnpm check`, `pnpm test:process`, `pnpm build`: code/type/regression/build checks.
- `pnpm check:launch`: read-only configuration and, when configured, database/roster/schema checks. Nonzero exit means a blocker. Does not run migrations or display credentials.
- `pnpm publish:directory`: offline import validation only; `--apply` is an explicit database mutation.
- `pnpm check:mcp <origin>`: public endpoint/metadata checks; does not establish a ChatGPT or Claude connection.
- `pnpm preview:process`: localhost-only demo, never production authentication.

A full rush application/interview/decision workflow, historical multi-cohort management, and a native mobile app are not implemented. The existing public recruitment site remains available. The current platform supports the new-member process through the mobile web app.

## Domain and rollback reference

The pre-promotion rollback reference for `www.ucsbsep.com` is `dpl_5Se7RYpFJNwa5tkfWASoFd87wEx3` (`https://sep-rush26-hixi5efkc-sepexecs-projects.vercel.app`). Verified aliases also include both `.org` hosts. The new deployment redirects `ucsbsep.com`, `ucsbsep.org` and `www.ucsbsep.org` to `https://www.ucsbsep.com`, preserving paths. This avoids mismatched Google origins and sessions.

Current production deployment: `dpl_2VM1ZfeQAeVSvTdKNZnkFkxbZWKS`. Hosted Google configuration and OAuth discovery return 200 JSON; unsigned process access returns 401. The authenticated real chapter view loaded 118 rendered images with zero broken images. Vercel promotion is complete. Google publication remains pending user approval.

## Canonical-domain recovery — October 12, 2026

- Reproduced a production CORS failure: `https://ucsbsep.com/` returned HTML (200), while its API calls redirected to `https://www.ucsbsep.com`. Added explicit root redirects for the three chapter aliases, plus a client startup guard that preserves paths, query strings, and fragments and redirects before rendering the app.
- Promoted `dpl_3kyiMeW3L2igjnnNTakiqdTjLW6d` (`sep-rush26-94tcnxg21-sepexecs-projects.vercel.app`). No commit or push.
- Verified all 14 public checks with `pnpm exec tsx scripts/check-public-domains.ts`: alias roots, login paths and Google-config paths redirect; canonical homepage/login/config/content endpoints respond without redirect; unsigned session request returns the expected 401 JSON. `.org` aliases use existing domain-level 301 redirects; `.com` uses 308.
- Browser verification started at the bare-domain homepage, arrived at `www`, clicked Login, and confirmed the Google sign-in button rendered with no captured console errors. This verifies the reported loading failure, not a new completed Google authentication.
- Eight canonical-origin tests, TypeScript check and production build passed. Screenshot: `artifacts/login-domain-fix.png`.
- The centered 720px member profile dialog and mobile layout are also confirmed in the published dashboard stylesheet. Academic-year rollover remains limited to returning members; Beta years are unchanged.
