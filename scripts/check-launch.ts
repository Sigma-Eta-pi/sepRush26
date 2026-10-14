import "dotenv/config";
import { allowedLoginEmail } from "../server/google-identity.js";

// Read-only readiness checks: never initialize schema, seed accounts, print
// credentials/member details, or confuse a local demo with a live deployment.
let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(
    `${ok ? "PASS" : "BLOCKED"} ${label}${detail ? ": " + detail : ""}`
  );
  if (!ok) failures++;
}
const database = process.env.DATABASE_URL || "";
const google = process.env.GOOGLE_CLIENT_ID || "";
check(
  "Google login client",
  /^\d+-[\w-]+\.apps\.googleusercontent\.com$/.test(google),
  google
    ? "configured value checked; not printed"
    : "set GOOGLE_CLIENT_ID on the verified host"
);
let origin: URL | undefined;
try {
  origin = new URL(process.env.APP_ORIGIN || "");
} catch {}
check(
  "Canonical HTTPS origin",
  !!origin &&
    origin.protocol === "https:" &&
    !origin.username &&
    !origin.password &&
    origin.pathname === "/" &&
    !origin.search &&
    !origin.hash,
  "APP_ORIGIN"
);
check(
  "Production database configured",
  /^postgres(?:ql)?:\/\//.test(database) &&
    !database.includes("USER:PASSWORD@"),
  "DATABASE_URL"
);
if (database && !database.includes("USER:PASSWORD@")) {
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(database, {
      fetchOptions: { signal: AbortSignal.timeout(15000) },
    });
    const tables = [
      "users",
      "profiles",
      "google_sessions",
      "member_process_state",
      "member_profile_edits",
      "mcp_auth_state",
      "member_directory_imports",
      "member_directory_assets",
    ];
    const rows =
      await sql`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
    const missing = tables.filter(
      name => !rows.some(row => row.tablename === name)
    );
    check(
      "Additive database schema",
      missing.length === 0,
      missing.length
        ? `missing ${missing.join(", ")}`
        : "all required tables exist"
    );
    if (!missing.length) {
      const users =
        await sql`SELECT u.id,u.email,u.role,COALESCE(e.archived,FALSE) AS archived FROM users u LEFT JOIN member_profile_edits e ON e.user_id=u.id`;
      const current = users.filter(u => !u.archived);
      const roster = current.filter(u => allowedLoginEmail(u.email));
      const duplicates =
        await sql`SELECT COUNT(*) AS total FROM (SELECT LOWER(email) FROM users GROUP BY LOWER(email) HAVING COUNT(*)>1) d`;
      check("Unambiguous login identities", Number(duplicates[0].total) === 0);
      check(
        "Approved Google administrator",
        roster.some(u => u.role === "admin"),
        "at least one existing, unarchived admin must be able to sign in"
      );
      check(
        "Pledge roster",
        roster.some(u => u.role === "pledge"),
        `${roster.filter(u => u.role === "pledge").length} current pledges`
      );
      check(
        "Active roster",
        roster.some(u => ["active", "exec"].includes(u.role)),
        `${roster.filter(u => ["active", "exec"].includes(u.role)).length} current actives/exec`
      );
      check(
        "Supported member roles",
        !current.some(u => u.role === "member"),
        "legacy member roles require explicit reviewed mapping"
      );
      const imports =
        await sql`SELECT jsonb_array_length(data->'profiles') AS count FROM member_directory_imports WHERE id='current'`;
      check(
        "Private directory published",
        Number(imports[0]?.count) > 0,
        `${Number(imports[0]?.count) || 0} imported profiles`
      );
      const settings =
        await sql`SELECT data->'settings' AS settings FROM member_process_state WHERE id='current'`;
      const config = settings[0]?.settings;
      check(
        "Cohort dates present (chapter review still required)",
        !!config?.startDate &&
          !!config?.endDate &&
          config.startDate <= config.endDate,
        "review actual cohort dates and deliverables with the pledge masters"
      );
    }
  } catch {
    check(
      "Database reachability",
      false,
      "unable to verify; connection details omitted"
    );
  }
}
check(
  "MCP enabled",
  process.env.MCP_ENABLED === "true",
  "ChatGPT and Claude each still need a real OAuth connection test"
);
const sms =
  process.env.SMS_ENABLED === "true" &&
  !!process.env.ANTHROPIC_API_KEY &&
  (process.env.SMS_RELAY_SECRET?.length || 0) >= 32 &&
  /^[^@\s]+@gmail\.com$/.test(process.env.SMS_GMAIL_ADDRESS || "") &&
  /^\+1\d{10}$/.test(process.env.SMS_VOICE_NUMBER || "");
check(
  "Text importer configured",
  sms,
  "requires chapter number, chapter Gmail, relay secret and AI key"
);
console.log(
  `\n${failures ? failures + " launch blockers found." : "Configuration checks passed."} This does not prove real Google sign-in, deployment, assistant connections, or incoming SMS delivery. Complete docs/LAUNCH-READINESS.md.`
);
process.exitCode = failures ? 1 : 0;
