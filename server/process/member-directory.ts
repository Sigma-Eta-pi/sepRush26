import { Router } from "express";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { User } from "../../client/src/member-portal/types.js";
import { chapterClassForName } from "../../client/src/data/chapter-roster.js";

export type ImportedMember = User & {
  notionId: string;
  sourceName: string;
  sourceUrl: string;
  membershipStatus: string;
};
export type Directory = {
  importedAt: string | null;
  source: string;
  profiles: ImportedMember[];
};
const empty: Directory = {
  importedAt: null,
  source: "Notion Member Profiles",
  profiles: [],
};
export const directoryPath = () =>
  path.resolve(process.env.MEMBER_IMPORT_DIR || ".private/member-import");
let cached: { file: string; mtime: number; data: Directory } | undefined;
export function readMemberDirectory(): Directory {
  const file = path.join(directoryPath(), "profiles.json");
  if (!existsSync(file)) return empty;
  const mtime = statSync(file).mtimeMs;
  if (cached?.file === file && cached.mtime === mtime) return cached.data;
  const data = JSON.parse(readFileSync(file, "utf8")) as Directory;
  if (!Array.isArray(data.profiles)) throw new Error("Invalid member import");
  const normalizedData = normalizeDirectory(data);
  cached = { file, mtime, data: normalizedData };
  return normalizedData;
}
export function normalizeDirectory(data: Directory): Directory {
  return {
    ...data,
    profiles: data.profiles.map(profile => ({
      ...profile,
      pledgeClass: chapterClassForName(profile.name),
      profileSections: profile.profileSections?.filter(
        section => section.title !== "Class"
      ),
    })),
  };
}
const normalized = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
export function enrichMemberProfiles(
  users: User[],
  imported = readMemberDirectory().profiles
): User[] {
  return users.map(user => {
    // A verified email match wins over a name match. Never choose the first
    // record when an import contains ambiguous identities.
    const emailMatches = user.email
      ? imported.filter(
          p => p.email && normalized(p.email) === normalized(user.email!)
        )
      : [];
    const nameMatches = imported.filter(p =>
      [p.name, p.sourceName].some(
        name =>
          name &&
          normalized(name) === normalized(user.directoryName || user.name)
      )
    );
    const match =
      emailMatches.length === 1
        ? emailMatches[0]
        : emailMatches.length === 0 && nameMatches.length === 1
          ? nameMatches[0]
          : undefined;
    if (!match) return { ...user, pledgeClass: chapterClassForName(user.name) };
    // Import profile content only. Never import Notion roles or grant account access.
    const result = { ...user };
    for (const field of [
      "phone",
      "major",
      "year",
      "pledgeClass",
      "hometown",
      "linkedin",
      "instagram",
      "photoUrl",
      "coverUrl",
      "coverPosition",
      "profileSections",
      "profileImages",
    ] as const) {
      if (
        match[field] &&
        (!Array.isArray(match[field]) || match[field].length)
      ) {
        Object.assign(result, { [field]: match[field] });
      }
    }
    result.pledgeClass = chapterClassForName(user.name);
    return result;
  });
}

// Mount only behind the host application's member authentication middleware.
export function memberDirectoryRouter(
  options: {
    hidden?: () => Promise<User[]> | User[];
    read?: () => Promise<Directory> | Directory;
    asset?: (filename: string) => Promise<Buffer | null>;
  } = {}
) {
  const router = Router();
  router.use((_req, res, next) => {
    res.set("Cache-Control", "private, no-store");
    next();
  });
  router.get("/", async (_req, res, next) => {
    try {
      const data = await (options.read || readMemberDirectory)();
      const hidden = (await options.hidden?.()) || [];
      res.json({
        ...data,
        profiles: data.profiles.filter(
          profile =>
            !hidden.some(
              user =>
                (user.email &&
                  profile.email &&
                  normalized(user.email) === normalized(profile.email)) ||
                [profile.name, profile.sourceName].some(
                  name =>
                    normalized(name) ===
                    normalized(user.directoryName || user.name)
                )
            )
        ),
      });
    } catch (e) {
      next(e);
    }
  });
  router.get("/assets/:file", async (req, res, next) => {
    try {
      if (!/^[a-f0-9]{24}\.jpg$/.test(req.params.file)) {
        res.status(404).end();
        return;
      }
      res.set("X-Content-Type-Options", "nosniff");
      if (options.asset) {
        const bytes = await options.asset(req.params.file);
        if (!bytes) {
          res.status(404).end();
          return;
        }
        res.type("image/jpeg").send(bytes);
        return;
      }
      const file = path.join(directoryPath(), "assets", req.params.file);
      if (!existsSync(file)) {
        res.status(404).end();
        return;
      }
      res.sendFile(file);
    } catch (e) {
      next(e);
    }
  });
  return router;
}
