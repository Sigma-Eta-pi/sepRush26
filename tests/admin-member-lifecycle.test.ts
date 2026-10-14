import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import express from "express";
import type { Server } from "node:http";
const mocks = vi.hoisted(() => ({
  sql: vi.fn(),
  transaction: vi.fn(),
  authRole: "admin",
}));
vi.mock("../server/db.js", () => ({
  sql: Object.assign(mocks.sql, { transaction: mocks.transaction }),
}));
vi.mock("../server/email.js", () => ({ sendBlastEmail: vi.fn() }));
vi.mock("../server/middleware/auth.js", () => ({
  requireAdmin: (req: any, res: any, next: any) => {
    if (mocks.authRole !== "admin") return res.status(403).end();
    req.user = { id: "admin", role: "admin" };
    next();
  },
  requireExec: (_req: any, _res: any, next: any) => next(),
}));
import router from "../server/routes/admin";
let server: Server, base: string;
const queryText = () =>
  mocks.sql.mock.calls.map(([parts]: any) => parts.join("?"));
beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use(router);
  app.use((error: any, _req: any, res: any, _next: any) =>
    res.status(500).json({ error: "Failed" })
  );
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterAll(() => server.close());
beforeEach(() => {
  mocks.authRole = "admin";
  mocks.sql.mockReset().mockImplementation((parts: TemplateStringsArray) => {
    const query = parts.join("?");
    if (query.includes("SELECT id, email, role"))
      return Promise.resolve([
        { id: "member", email: "old@ucsb.edu", role: "active", is_editor: 0 },
      ]);
    if (query.startsWith("SELECT id FROM users WHERE id="))
      return Promise.resolve([{ id: "member" }]);
    return Promise.resolve([]);
  });
  mocks.transaction.mockReset().mockResolvedValue([]);
});
const change = (body: unknown) =>
  fetch(base + "/users/member", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
it("identity transfers revoke Google and MCP grants in the same transaction", async () => {
  expect((await change({ email: "new@umail.ucsb.edu" })).status).toBe(200);
  const queries = queryText();
  expect(queries.some(q => q.includes("google_sub=CASE"))).toBe(true);
  expect(queries.some(q => q.includes("DELETE FROM google_sessions"))).toBe(
    true
  );
  expect(queries.some(q => q.includes("DELETE FROM mcp_auth_state"))).toBe(
    true
  );
  expect(mocks.transaction).toHaveBeenCalledTimes(1);
});
it("permission changes revoke old grants while class-only edits retain sessions", async () => {
  expect((await change({ role: "pledge" })).status).toBe(200);
  expect(queryText().some(q => q.includes("DELETE FROM mcp_auth_state"))).toBe(
    true
  );
  mocks.sql.mockClear();
  expect((await change({ pledgeClass: "Alpha" })).status).toBe(200);
  expect(queryText().some(q => q.includes("DELETE FROM"))).toBe(false);
});
it("archive preserves user/profile/task records and invalidates both access paths", async () => {
  const response = await fetch(base + "/users/member", { method: "DELETE" });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ archived: true });
  const queries = queryText();
  expect(
    queries.some(q => q.includes("INSERT INTO member_profile_edits"))
  ).toBe(true);
  expect(queries.some(q => q.includes("DELETE FROM mcp_auth_state"))).toBe(
    true
  );
  expect(queries.some(q => q.includes("DELETE FROM google_sessions"))).toBe(
    true
  );
  expect(
    queries.some(q => /DELETE FROM (users|profiles|tasks)\b/.test(q))
  ).toBe(false);
  expect(queries.some(q => q.includes("version=version+1"))).toBe(true);
});
it("restores archived members without new IDs or recreated profiles", async () => {
  const response = await fetch(base + "/users/member/restore", {
    method: "POST",
  });
  expect(await response.json()).toMatchObject({ archived: false });
  expect(queryText().some(q => /INSERT INTO (users|profiles)\b/.test(q))).toBe(
    false
  );
  expect(
    mocks.sql.mock.calls.some(
      ([parts, ...values]: any) =>
        parts.join("").includes("INSERT INTO member_profile_edits") &&
        values.includes(false)
    )
  ).toBe(true);
});
it("rejects self archive and unauthorized users before issuing mutations", async () => {
  expect(
    (await fetch(base + "/users/admin", { method: "DELETE" })).status
  ).toBe(403);
  mocks.authRole = "active";
  expect(
    (await fetch(base + "/users/member", { method: "DELETE" })).status
  ).toBe(403);
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("returns failure when a lifecycle transaction fails", async () => {
  mocks.transaction.mockRejectedValue(new Error("Database unavailable"));
  expect(
    (await fetch(base + "/users/member", { method: "DELETE" })).status
  ).toBe(500);
});
