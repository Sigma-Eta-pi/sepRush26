import { beforeAll, afterAll, it, expect, vi } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
vi.mock("../server/db.js", () => ({ sql: vi.fn(async () => []) }));
vi.mock("../server/middleware/auth.js", () => ({
  requireAuth: (req: any, res: any, next: any) => {
    const role = req.headers["x-test-role"];
    if (!role) return res.status(401).end();
    req.user = { id: "member", role };
    next();
  },
}));
import router from "../server/routes/process";
import {
  enrichMemberProfiles,
  type ImportedMember,
} from "../server/process/member-directory";
let server: Server, base: string, dir: string;
const previousDir = process.env.MEMBER_IMPORT_DIR;
const photo = "0123456789abcdef01234567.jpg";
const imported = {
  id: "notion-id",
  name: "Example Member",
  sourceName: "Example Member",
  email: "member@ucsb.edu",
  role: "master",
  phone: "5551234567",
  major: "Biology",
  year: "Junior",
  color: "blue",
  notionId: "notion",
  sourceUrl: "https://notion.so/example",
  membershipStatus: "Active",
  photoUrl: "/api/process/directory/assets/" + photo,
} satisfies ImportedMember;
beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "sep-directory-test-"));
  process.env.MEMBER_IMPORT_DIR = dir;
  mkdirSync(path.join(dir, "assets"));
  writeFileSync(
    path.join(dir, "profiles.json"),
    JSON.stringify({
      importedAt: "2026-10-05",
      source: "fixture",
      profiles: [imported],
    })
  );
  writeFileSync(path.join(dir, "assets", photo), "fixture image");
  const app = express();
  app.use("/process", router);
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as any).port}/process/directory`;
});
afterAll(() => {
  server.close();
  rmSync(dir, { recursive: true });
  if (previousDir === undefined) delete process.env.MEMBER_IMPORT_DIR;
  else process.env.MEMBER_IMPORT_DIR = previousDir;
});
it("requires member access for private directory data and photos", async () => {
  for (const suffix of ["", "/assets/" + photo]) {
    expect((await fetch(base + suffix)).status).toBe(401);
    expect(
      (await fetch(base + suffix, { headers: { "x-test-role": "pnm" } })).status
    ).toBe(403);
    const allowed = await fetch(base + suffix, {
      headers: { "x-test-role": "active" },
    });
    expect(allowed.status).toBe(200);
    expect(allowed.headers.get("cache-control")).toContain("no-store");
  }
});
it("does not serve arbitrary import files through the asset route", async () => {
  expect(
    (
      await fetch(base + "/assets/profiles.json", {
        headers: { "x-test-role": "active" },
      })
    ).status
  ).toBe(404);
});
it("imports profile details without importing roles, user IDs, or login email", () => {
  const account = {
    ...imported,
    id: "real-account",
    role: "pledge" as const,
    email: "current@ucsb.edu",
    phone: "",
  };
  const result = enrichMemberProfiles([account], [imported])[0];
  expect(result.phone).toBe(imported.phone);
  expect(result.photoUrl).toBe(imported.photoUrl);
  expect(result.id).toBe("real-account");
  expect(result.role).toBe("pledge");
  expect(result.email).toBe("current@ucsb.edu");
  expect(account.phone).toBe("");
});
