import "dotenv/config";
import { resolve } from "node:path";
import { prepareDirectoryImport } from "../server/process/directory-migration.js";

// Default is a fully offline validation. Never print profile contents or credentials.
let databasePhase = false;
async function main() {
  const args = process.argv.slice(2);
  const root =
    args.find(arg => !arg.startsWith("--")) ||
    process.env.MEMBER_IMPORT_DIR ||
    ".private/member-import";
  if (args.some(arg => arg.startsWith("--") && arg !== "--apply"))
    throw new Error("Supported option: --apply. Default is dry-run.");
  const prepared = prepareDirectoryImport(resolve(root));
  console.log(
    `Validated ${prepared.directory.profiles.length} profiles and ${prepared.assets.length} private photos (${(prepared.totalBytes / 1024 / 1024).toFixed(1)} MB).`
  );
  console.log(`Import ID: ${prepared.digest}`);
  if (!args.includes("--apply")) {
    console.log(
      "DRY RUN: no database connection or changes. Configure the verified target DATABASE_URL, back up the database, then rerun with --apply."
    );
    return;
  }
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is required for --apply.");
  databasePhase = true;
  const { sql, initDb } = await import("../server/db.js");
  await initDb();
  // Content-addressed filenames cannot be silently replaced. Interrupted upload keeps
  // the old directory active; already uploaded identical photos make retries safe.
  for (const asset of prepared.assets) {
    const rows =
      await sql`INSERT INTO member_directory_assets(filename,sha256,content_base64)
      VALUES(${asset.filename},${asset.sha256},${asset.bytes.toString("base64")})
      ON CONFLICT(filename) DO UPDATE SET sha256=EXCLUDED.sha256
      WHERE member_directory_assets.sha256=EXCLUDED.sha256 RETURNING filename`;
    if (!rows.length)
      throw new Error(
        "A stored photo has different content under the same filename. Import not published."
      );
  }
  await sql.transaction([
    sql`INSERT INTO member_directory_imports(id,data) VALUES(${prepared.digest},${JSON.stringify(prepared.directory)}::jsonb) ON CONFLICT(id) DO NOTHING`,
    sql`INSERT INTO member_directory_imports(id,data) VALUES('current',${JSON.stringify(prepared.directory)}::jsonb)
      ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data, created_at=NOW()`,
  ]);
  console.log(
    "Published private directory. Accounts, permissions and process records were not changed. Previous import versions remain retained."
  );
}
main().catch(error => {
  // SQL/provider exceptions may include payloads or connection details.
  console.error(
    databasePhase
      ? "Database operation failed; directory publication was not confirmed."
      : error.message
  );
  process.exitCode = 1;
});
