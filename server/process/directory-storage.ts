import { sql } from "../db.js";
import {
  directoryPath,
  normalizeDirectory,
  readMemberDirectory,
  type Directory,
} from "./member-directory.js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const useDatabase = () =>
  process.env.MEMBER_IMPORT_STORAGE === "database" ||
  (process.env.NODE_ENV === "production" &&
    process.env.MEMBER_IMPORT_STORAGE !== "filesystem");
export async function productionDirectory(): Promise<Directory> {
  if (!useDatabase()) return readMemberDirectory();
  const rows =
    await sql`SELECT data FROM member_directory_imports WHERE id='current'`;
  return normalizeDirectory(
    rows[0]?.data || {
      importedAt: null,
      source: "Notion Member Profiles",
      profiles: [],
    }
  );
}
export async function productionDirectoryAsset(
  filename: string
): Promise<Buffer | null> {
  if (!/^[a-f0-9]{24}\.jpg$/.test(filename)) return null;
  if (!useDatabase()) {
    const file = path.join(directoryPath(), "assets", filename);
    return existsSync(file) ? readFileSync(file) : null;
  }
  const rows =
    await sql`SELECT content_base64 FROM member_directory_assets WHERE filename=${filename}`;
  return rows[0] ? Buffer.from(rows[0].content_base64, "base64") : null;
}
