import "dotenv/config";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import { neon } from "@neondatabase/serverless";
import {
  planRosterProvisioning,
  type ExistingRosterAccount,
} from "../server/process/roster-provisioning";

const { values } = parseArgs({
  options: {
    file: { type: "string" },
    apply: { type: "boolean", default: false },
    expect: { type: "string" },
    help: { type: "boolean", default: false },
  },
});
if (values.help || !values.file) {
  console.log(
    "Usage: pnpm exec tsx scripts/provision-roster.ts --file .private/production-roster.json [--apply --expect REVIEWED_FINGERPRINT]\nDefault: read-only dry run. Uses DATABASE_URL. Does not initialize schemas or infer member identities/roles."
  );
  process.exit(values.help ? 0 : 1);
}
let databaseOperation = false;
async function main() {
  if (!process.env.DATABASE_URL)
    throw new Error("Set DATABASE_URL to the intended chapter database.");
  databaseOperation = true;
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT u.id,u.email,u.role,p.name,
    EXISTS(SELECT 1 FROM profiles q WHERE q.user_id=u.id) AS "hasProfile",
    COALESCE(m.archived,FALSE) AS archived FROM users u
    LEFT JOIN LATERAL(SELECT name FROM profiles WHERE user_id=u.id ORDER BY updated_at DESC LIMIT 1) p ON TRUE
    LEFT JOIN member_profile_edits m ON m.user_id=u.id ORDER BY u.id`;
  databaseOperation = false;
  const plan = planRosterProvisioning(
    JSON.parse(readFileSync(values.file!, "utf8")),
    rows as ExistingRosterAccount[]
  );
  console.log(
    JSON.stringify(
      { mode: values.apply ? "apply" : "dry-run", ...plan },
      null,
      2
    )
  );
  if (!values.apply) {
    console.log(
      "No changes made. Review every email/role/ID, then pass --apply --expect with this fingerprint."
    );
    return;
  }
  if (values.expect !== plan.fingerprint)
    throw new Error(
      "The reviewed fingerprint is missing or changed. Run a new dry run and review the current plan."
    );
  const now = new Date().toISOString();
  // Lock only for the short transaction, then recheck identities/roles in SQL.
  // Any failed guard aborts the entire batch, including previously executed rows.
  const queries = [
    sql`LOCK TABLE users, profiles, member_profile_edits IN SHARE ROW EXCLUSIVE MODE`,
  ];
  for (const member of plan.members) {
    const id = member.id || randomUUID();
    if (member.action === "create") {
      queries.push(sql`WITH changed AS (
        INSERT INTO users(id,email,password_hash,role,created_at,first_login)
        SELECT ${id},${member.email},'google-only',${member.role},${now},0
        WHERE NOT EXISTS(SELECT 1 FROM users WHERE LOWER(email)=${member.email})
        RETURNING id
      ) SELECT 1 / COUNT(*)::integer AS guard FROM changed`);
    } else {
      queries.push(sql`WITH changed AS (
        UPDATE users SET role=${member.role} WHERE id=${id} AND email=${member.previousEmail}
          AND role=${member.previousRole}
          AND NOT EXISTS(SELECT 1 FROM member_profile_edits WHERE user_id=${id} AND archived=TRUE)
          AND NOT EXISTS(SELECT 1 FROM users WHERE LOWER(email)=${member.email} AND id<>${id})
        RETURNING id
      ) SELECT 1 / COUNT(*)::integer AS guard FROM changed`);
    }
    if (member.createProfile) {
      queries.push(sql`WITH changed AS (
        INSERT INTO profiles(id,user_id,name,created_at,updated_at)
        SELECT ${randomUUID()},${id},${member.name},${now},${now}
        WHERE NOT EXISTS(SELECT 1 FROM profiles WHERE user_id=${id}) RETURNING id
      ) SELECT 1 / COUNT(*)::integer AS guard FROM changed`);
    }
    if (member.action === "change-role") {
      queries.push(sql`DELETE FROM google_sessions WHERE user_id=${id}`);
      queries.push(
        sql`DELETE FROM mcp_auth_state WHERE value->>'userId'=${id}`
      );
    }
  }
  databaseOperation = true;
  await sql.transaction(queries);
  databaseOperation = false;
  console.log(
    `Applied reviewed roster transaction: ${plan.summary.create} accounts created, ${plan.summary.changeRole} roles changed, existing IDs/profile content preserved.`
  );
}
main().catch(error => {
  // Never dump database errors, connection URLs, query parameters or credentials.
  const safe =
    databaseOperation || error?.code
      ? "Database operation failed; no transaction success is confirmed. Run a fresh dry run before retrying."
      : error instanceof Error
        ? error.message
        : "Roster provisioning failed.";
  console.error(safe);
  process.exitCode = 1;
});
