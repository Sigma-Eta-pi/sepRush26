import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Directory } from "./member-directory.js";
export const assetPrefix = "/api/process/directory/assets/";
export function prepareDirectoryImport(root: string) {
  const raw = readFileSync(path.join(root, "profiles.json"), "utf8");
  if (Buffer.byteLength(raw) > 8 * 1024 * 1024)
    throw new Error("Directory JSON exceeds 8 MB.");
  const directory = JSON.parse(raw) as Directory;
  if (
    !Array.isArray(directory.profiles) ||
    !directory.profiles.length ||
    directory.profiles.length > 1000
  )
    throw new Error("Import must contain 1–1000 profiles.");
  const ids = new Set<string>();
  for (const profile of directory.profiles) {
    if (
      !profile ||
      typeof profile.id !== "string" ||
      !profile.id ||
      ids.has(profile.id) ||
      typeof profile.name !== "string" ||
      !profile.name.trim()
    )
      throw new Error(
        "Import contains missing or duplicate profile IDs, or an unnamed member."
      );
    ids.add(profile.id);
  }
  const filenames = new Set<string>();
  function walk(value: unknown) {
    if (typeof value === "string" && value.startsWith(assetPrefix)) {
      const filename = value.slice(assetPrefix.length);
      if (!/^[a-f0-9]{24}\.jpg$/.test(filename))
        throw new Error("Invalid private asset reference.");
      filenames.add(filename);
    } else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object")
      Object.values(value).forEach(walk);
  }
  walk(directory.profiles);
  const assets = [...filenames].sort().map(filename => {
    const bytes = readFileSync(path.join(root, "assets", filename));
    if (
      bytes.length > 2 * 1024 * 1024 ||
      bytes.length < 4 ||
      bytes[0] !== 0xff ||
      bytes[1] !== 0xd8 ||
      bytes[2] !== 0xff
    )
      throw new Error("Private assets must be JPEG images of at most 2 MB.");
    return {
      filename,
      bytes,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  });
  const totalBytes = assets.reduce(
    (total, asset) => total + asset.bytes.length,
    0
  );
  if (totalBytes > 100 * 1024 * 1024) throw new Error("Import exceeds 100 MB.");
  const digest = createHash("sha256")
    .update(JSON.stringify(directory))
    .update(JSON.stringify(assets.map(a => [a.filename, a.sha256])))
    .digest("hex");
  return { directory, assets, totalBytes, digest };
}
