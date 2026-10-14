import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import express from "express";
import type { Server } from "node:http";
const mocks = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock("../server/db.js", () => ({ sql: mocks.sql }));
import documents from "../server/routes/documents";
import events from "../server/routes/events";
import tasks from "../server/routes/tasks";
import updates from "../server/routes/updates";
let server: Server, base: string, role: string;
beforeAll(async () => {
  const app = express();
  app.use(express.json());
  for (const [path, router] of Object.entries({
    documents,
    events,
    tasks,
    updates,
  }))
    app.use("/" + path, router);
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterAll(() => server.close());
beforeEach(() => {
  role = "pledge";
  mocks.sql
    .mockReset()
    .mockImplementation(async (strings: TemplateStringsArray) => {
      if (strings.join("?").includes("FROM google_sessions"))
        return [{ id: "member", email: "member@ucsb.edu", role }];
      return [];
    });
});
const headers = {
  Authorization: "Bearer " + "a".repeat(64),
  "Content-Type": "application/json",
};
it.each(["documents", "events", "tasks", "updates"])(
  "denies pledge/PNM requests before reading %s data",
  async path => {
    for (const denied of ["pledge", "pnm"]) {
      role = denied;
      const response = await fetch(`${base}/${path}`, { headers });
      expect(response.status).toBe(403);
    }
    expect(mocks.sql).toHaveBeenCalledTimes(2);
    expect((await fetch(`${base}/${path}`)).status).toBe(401);
  }
);
it.each(["active", "pledge_master", "exec", "admin"])(
  "preserves chapter reads for %s",
  async allowed => {
    role = allowed;
    for (const path of ["documents", "events", "tasks", "updates"])
      expect((await fetch(`${base}/${path}`, { headers })).status).toBe(200);
  }
);
it("prevents pledge masters editing another member’s legacy chapter task", async () => {
  role = "pledge_master";
  mocks.sql.mockImplementation(async (strings: TemplateStringsArray) => {
    if (strings.join("?").includes("FROM google_sessions"))
      return [{ id: "member", role }];
    return [{ id: "task", assigned_to: "someone-else" }];
  });
  const response = await fetch(`${base}/tasks/task`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ status: "done" }),
  });
  expect(response.status).toBe(403);
  expect(mocks.sql).toHaveBeenCalledTimes(2);
});
