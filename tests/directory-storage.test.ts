import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/db.js", () => ({ sql: query }));
import {
  productionDirectory,
  productionDirectoryAsset,
} from "../server/process/directory-storage";
import { memberDirectoryRouter } from "../server/process/member-directory";
import {
  prepareDirectoryImport,
  assetPrefix,
} from "../server/process/directory-migration";
const filename = "0123456789abcdef01234567.jpg";
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0xff, 0xd9]);
const profile = {
  id: "member-1",
  name: "Test Person",
  photoUrl: assetPrefix + filename,
};
afterEach(() => {
  vi.unstubAllEnvs();
  query.mockReset();
});
describe("serverless private directory", () => {
  it("loads production profiles and JPEG bytes from the database without local files", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MEMBER_IMPORT_DIR", "/nonexistent/sep-test");
    query.mockResolvedValueOnce([
      {
        data: {
          importedAt: "2026-10-12",
          source: "fixture",
          profiles: [profile],
        },
      },
    ]);
    expect((await productionDirectory()).profiles[0].name).toBe("Test Person");
    query.mockResolvedValueOnce([{ content_base64: jpeg.toString("base64") }]);
    expect(await productionDirectoryAsset(filename)).toEqual(jpeg);
    expect(query).toHaveBeenCalledTimes(2);
  });
  it("rejects unsafe asset names before consulting storage", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await productionDirectoryAsset("../profiles.json")).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });
  it("serves private image content with no-store and nosniff and propagates storage failures", async () => {
    const app = express();
    const asset = vi
      .fn()
      .mockResolvedValueOnce(jpeg)
      .mockRejectedValueOnce(new Error("offline"));
    app.use(memberDirectoryRouter({ asset }));
    app.use(
      (
        _e: unknown,
        _q: express.Request,
        r: express.Response,
        _n: express.NextFunction
      ) => r.status(503).end()
    );
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>(resolve => server.once("listening", resolve));
    try {
      const url = `http://127.0.0.1:${(server.address() as any).port}/assets/${filename}`;
      const response = await fetch(url);
      expect(response.headers.get("content-type")).toContain("image/jpeg");
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect(Buffer.from(await response.arrayBuffer())).toEqual(jpeg);
      expect((await fetch(url)).status).toBe(503);
    } finally {
      server.close();
    }
  });
});
describe("offline directory migration validation", () => {
  function fixture(profiles: unknown[] = [profile]) {
    const root = mkdtempSync(path.join(tmpdir(), "sep-publish-test-"));
    mkdirSync(path.join(root, "assets"));
    writeFileSync(
      path.join(root, "profiles.json"),
      JSON.stringify({ importedAt: null, source: "fixture", profiles })
    );
    writeFileSync(path.join(root, "assets", filename), jpeg);
    return root;
  }
  it("deduplicates repeated photos and generates a stable content fingerprint", () => {
    const root = fixture([{ ...profile, coverUrl: profile.photoUrl }]);
    try {
      const prepared = prepareDirectoryImport(root);
      expect(prepared.assets).toHaveLength(1);
      expect(prepared.totalBytes).toBe(jpeg.length);
      expect(prepareDirectoryImport(root).digest).toBe(prepared.digest);
      writeFileSync(
        path.join(root, "assets", filename),
        Buffer.concat([jpeg, Buffer.from([1])])
      );
      expect(prepareDirectoryImport(root).digest).not.toBe(prepared.digest);
    } finally {
      rmSync(root, { recursive: true });
    }
  });
  it("fails before any database write for missing photos, path traversal or duplicate identities", () => {
    for (const profiles of [
      [{ ...profile, photoUrl: assetPrefix + "../secret.jpg" }],
      [profile, profile],
    ]) {
      const root = fixture(profiles);
      try {
        expect(() => prepareDirectoryImport(root)).toThrow();
      } finally {
        rmSync(root, { recursive: true });
      }
    }
    const root = fixture();
    try {
      rmSync(path.join(root, "assets", filename));
      expect(() => prepareDirectoryImport(root)).toThrow();
    } finally {
      rmSync(root, { recursive: true });
    }
  });
});
