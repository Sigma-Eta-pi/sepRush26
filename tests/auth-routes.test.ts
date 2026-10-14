import { beforeAll, afterAll, beforeEach, it, expect, vi } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import type { Server } from "node:http";
const mocks = vi.hoisted(() => ({ sql: vi.fn(), verify: vi.fn() }));
vi.mock("../server/db.js", () => ({ sql: mocks.sql }));
vi.mock("google-auth-library", () => ({
  OAuth2Client: class {
    verifyIdToken = mocks.verify;
  },
}));
import router from "../server/routes/auth";
let server: Server, base: string;
beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/auth", router);
  app.use((err: any, _req: any, res: any, _next: any) =>
    res.status(err.status || 500).json({ error: "Server error" })
  );
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterAll(() => server.close());
beforeEach(() => {
  vi.clearAllMocks();
  process.env.GOOGLE_CLIENT_ID = "test-client-id";
  delete process.env.APP_ORIGIN;
});
const post = (
  path: string,
  body: object,
  headers: Record<string, string> = {}
) =>
  fetch(base + "/auth/" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
it("verifies audience, binds the existing member ID, and issues an HttpOnly session", async () => {
  const cfg = await fetch(base + "/auth/config"),
    config = await cfg.json();
  const nonceCookie = cfg.headers.get("set-cookie")!.split(";")[0];
  mocks.verify.mockResolvedValue({
    getPayload: () => ({
      sub: "verified-sub",
      email: "existing@umail.ucsb.edu",
      hd: "ucsb.edu",
      email_verified: true,
      nonce: config.nonce,
    }),
  });
  mocks.sql.mockImplementation(async (strings: TemplateStringsArray) => {
    const q = strings.join("?");
    if (q.includes("SELECT id,email,role"))
      return [
        {
          id: "existing-id",
          email: "existing@umail.ucsb.edu",
          role: "pledge",
          is_editor: 0,
        },
      ];
    if (q.includes("UPDATE users")) return [{ id: "existing-id" }];
    if (q.includes("INSERT INTO google_sessions"))
      return [{ token_hash: "stored-hash" }];
    if (q.includes("SELECT name")) return [{ name: "Existing Member" }];
    return [];
  });
  const r = await post(
    "google",
    { credential: "signed-google-token" },
    { Cookie: nonceCookie, Origin: base }
  );
  expect(r.status).toBe(200);
  const data = await r.json();
  expect(data.user.id).toBe("existing-id");
  expect(data.token).toMatch(/^[a-f0-9]{64}$/);
  expect(r.headers.get("set-cookie")).toContain("HttpOnly");
  expect(mocks.verify).toHaveBeenCalledWith({
    idToken: "signed-google-token",
    audience: "test-client-id",
  });
  expect(
    mocks.sql.mock.calls.some(([q]: any) =>
      q.join("").includes("INSERT INTO users")
    )
  ).toBe(false);
});
it("rejects unregistered school accounts without creating users or sessions", async () => {
  const cfg = await fetch(base + "/auth/config"),
    config = await cfg.json();
  mocks.verify.mockResolvedValue({
    getPayload: () => ({
      sub: "sub",
      email: "unknown@ucsb.edu",
      hd: "ucsb.edu",
      email_verified: true,
      nonce: config.nonce,
    }),
  });
  mocks.sql.mockResolvedValue([]);
  const r = await post(
    "google",
    { credential: "valid" },
    { Cookie: cfg.headers.get("set-cookie")!.split(";")[0] }
  );
  expect(r.status).toBe(403);
  expect(mocks.sql).toHaveBeenCalledTimes(1);
});
it("rejects old JWTs and unknown opaque sessions", async () => {
  const r = await fetch(base + "/auth/me", {
    headers: { Authorization: "Bearer old.jwt.token" },
  });
  expect(r.status).toBe(401);
  expect(mocks.sql).not.toHaveBeenCalled();
  mocks.sql.mockResolvedValue([]);
  expect(
    (
      await fetch(base + "/auth/me", {
        headers: { Cookie: "sep_google_session=" + "a".repeat(64) },
      })
    ).status
  ).toBe(401);
});
it("retires password login and rejects cross-origin session mutations", async () => {
  expect((await post("login", { email: "old", password: "old" })).status).toBe(
    410
  );
  expect(
    (
      await post(
        "google",
        { credential: "credential" },
        { Origin: "https://other.example" }
      )
    ).status
  ).toBe(403);
  expect(mocks.verify).not.toHaveBeenCalled();
});
it("reports missing Google configuration without pretending login works", async () => {
  delete process.env.GOOGLE_CLIENT_ID;
  expect((await post("google", { credential: "token" })).status).toBe(503);
  expect(mocks.verify).not.toHaveBeenCalled();
});
it('chapter executive Google login keeps the existing admin ID and role without auto-promotion', async () => {
  const cfg = await fetch(base + '/auth/config'), config = await cfg.json();
  mocks.verify.mockResolvedValue({getPayload: () => ({sub:'chapter-sub', email:'exec@ucsbsep.org', hd:'ucsbsep.org', email_verified:true, nonce:config.nonce})});
  mocks.sql.mockImplementation(async (parts: TemplateStringsArray) => {
    const q = parts.join('?');
    if (q.includes('SELECT id,email,role')) return [{id:'chapter-id',email:'exec@ucsbsep.org',role:'admin',is_editor:0}];
    if (q.includes('UPDATE users')) return [{id:'chapter-id'}];
    if (q.includes('INSERT INTO google_sessions')) return [{token_hash:'hash'}];
    if (q.includes('SELECT name')) return [{name:'Chapter Executive'}];
    return [];
  });
  const response = await post('google',{credential:'signed-token'},{Cookie:cfg.headers.get('set-cookie')!.split(';')[0]});
  expect(response.status).toBe(200);
  expect((await response.json()).user).toMatchObject({id:'chapter-id',role:'admin'});
  expect(mocks.sql.mock.calls.some(([parts]: any) => /INSERT INTO users|SET role/.test(parts.join('?')))).toBe(false);
  mocks.sql.mockResolvedValue([]);
  const denied = await post('google',{credential:'signed-token'},{Cookie:cfg.headers.get('set-cookie')!.split(';')[0]});
  expect(denied.status).toBe(403);
});
it('promotes the rostered chapter executive account to admin at sign-in', async () => {
  const cfg = await fetch(base + '/auth/config'), config = await cfg.json();
  mocks.verify.mockResolvedValue({getPayload: () => ({sub:'chapter-sub', email:'exec@ucsbsep.org', hd:'ucsbsep.org', email_verified:true, nonce:config.nonce})});
  mocks.sql.mockImplementation(async (parts: TemplateStringsArray) => {
    const q = parts.join('?');
    if (q.includes('SELECT id,email,role')) return [{id:'chapter-id',email:'exec@ucsbsep.org',role:'exec',is_editor:0}];
    if (q.includes('UPDATE users')) return [{id:'chapter-id'}];
    if (q.includes('INSERT INTO google_sessions')) return [{token_hash:'hash'}];
    return [];
  });
  const response = await post('google',{credential:'signed-token'},{Cookie:cfg.headers.get('set-cookie')!.split(';')[0]});
  expect(response.status).toBe(200);
  expect((await response.json()).user.role).toBe('admin');
  expect(mocks.sql.mock.calls.some(([parts]: any) => /SET role='admin'/.test(parts.join('?')))).toBe(true);
  expect(mocks.sql.mock.calls.some(([parts]: any) => /INSERT INTO users/.test(parts.join('?')))).toBe(false);
});
