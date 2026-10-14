# Provision the real SEP roster

The local demo's active/pledge assignments are fictional. Do not copy its accounts, roles, strikes, or process records into production. A Notion profile import provides profile content; it does **not** create login accounts or grant membership.

Use `scripts/provision-roster.ts` with a reviewed list of exact Google account emails and actual roles. The tool defaults to a read-only plan. It does not initialize schemas, guess aliases, choose pledge masters, convert an entire class into pledges, restore removed accounts, or delete anyone absent from the list.

**Do not use `pnpm seed:founding` to launch the platform.** That legacy script writes role `member` (not a supported process role), assigns its entire list the `Founder` class, and uses the retired password model. Existing accounts created by older scripts must be reviewed, not blindly recreated.

## Prepare a reviewed roster

1. Complete the application's additive database setup against the intended chapter database. Set `DATABASE_URL` locally through the existing secret configuration; never paste the connection URL into chat or commit it.
2. Copy `docs/templates/production-roster.template.json` to `.private/production-roster.json`. This directory is ignored by Git. The template intentionally contains invalid email placeholders, so it cannot accidentally provision real accounts.
3. Replace the example rows with **every member you intend to provision**. Verify each email directly against the member's UCSB Google account. `@ucsb.edu` and `@umail.ucsb.edu` are supported but are not assumed interchangeable. The sole non-UCSB exception is the chapter-owned `exec@ucsbsep.org`; its existing administrator role includes pledge-master access. Do not invent school addresses from personal emails or names.
4. Supply an explicit role for every person:
   - `active`: chapter member who reports strikes and confirms their coffee chats.
   - `pledge`: new member with their own process view.
   - `pledge_master`: process administration and pledge management.
   - `exec`: chapter executive permissions, without automatically making them a pledge master.
   - `admin`: account administration plus pledge-master access. Use for an explicitly designated account administrator.
   - `pnm`: rush applicant; does not grant process member access.
5. If an existing account's role should change, add `"approveRoleChange": true` to that specific reviewed row. A new or changed `admin`, `exec`, or `pledge_master` role additionally requires `"approvePrivilegedRole": true`. Existing matching privileged roles do not need a new acknowledgement.
6. `existingUserId` is optional. Use it to assert an already-known account ID. Its exact email must match the row; the tool does not transfer identities. Make any necessary email corrections through the account administrator first, then rerun the plan.

Existing account IDs, Google identities, profile contents, and member-process references are preserved. Missing profiles get only the reviewed name. Existing profiles are not overwritten. Archived accounts require an explicit restore first. A same-name account under another email blocks automatic creation to prevent duplicate identities.

## Review without writing

```sh
pnpm exec tsx scripts/provision-roster.ts --file .private/production-roster.json
```

Review each printed action, email, role, existing ID, and the summary. The plan includes a SHA-256 fingerprint of these decisions. Keep this output private because it contains member identities. If the schema is missing or an identity is ambiguous, stop and resolve the underlying issue.

The command does not write to the database unless `--apply` is present. Confirm the configured database through your hosting dashboard; the script deliberately does not print connection credentials.

## Apply the reviewed plan

```sh
pnpm exec tsx scripts/provision-roster.ts \
  --file .private/production-roster.json \
  --apply --expect REVIEWED_FINGERPRINT
```

The script reads current database state again and refuses a missing or changed fingerprint. During its short SQL transaction it locks the member tables, checks expected existing identities/roles and archival state, creates missing accounts/profiles, and updates only explicitly approved roles. A failed guard rolls back the batch. Role changes revoke both Google and MCP sessions. Unlisted accounts are untouched.

After success, rerun the dry-run command. Every intended account should now be `keep` with no missing profile. Then verify actual Google sign-in and each role's permitted view. This does not activate OAuth credentials, upload private photos, install the SMS relay, or create the real schedule and assignments; those are separate setup steps.

## Reversible account removal

The account administration API now archives a removed account rather than deleting its user, profile, tasks, or process references. Existing URL `DELETE /api/admin/users/:id` returns `{ "success": true, "archived": true }` and revokes Google/MCP access atomically. `POST /api/admin/users/:id/restore` restores the same account ID. `GET /api/admin/users?includeArchived=true` includes removed members and their `archived` flag for review.

Email transfers and permission changes also revoke both Google and MCP sessions in one transaction. A member must authenticate again with the currently authorized identity.

## Validation boundaries

The provisioning planner and administrator routes have synthetic regression coverage for duplicate emails, ambiguous matches, exact ID matching, legacy roles, privilege acknowledgement, archival preservation, grant revocation, and transaction failures. A production database mutation was **not** run as part of implementing this tool. Back up the actual database through the hosting provider before the first production provisioning run; use a staging database for the first end-to-end test.
