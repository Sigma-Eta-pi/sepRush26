import express from "express";
import { afterAll, beforeAll, expect, it } from "vitest";
import type { Server } from "node:http";
import { viewAsGuard, viewAsId } from "../server/process/view-as";

let server: Server, base: string;
beforeAll(async () => {
  const app = express();
  app.use(viewAsGuard(req => req.get("x-role") === "admin"));
  app.all("/thing", (req, res) => res.json({ as: viewAsId(req) || null }));
  await new Promise<void>(done => (server = app.listen(0, done)));
  base = `http://127.0.0.1:${(server.address() as any).port}/thing`;
});
afterAll(() => server.close());
const call = (role: string, method = "GET", as = "pledge-1") =>
  fetch(base, { method, headers: { "x-role": role, "x-sep-view-as": as } });

it("lets only admins view as another member, and never write as them", async () => {
  const admin = await call("admin");
  expect(await admin.json()).toEqual({ as: "pledge-1" });
  for (const role of ["pledge_master", "exec", "active", "pledge"])
    expect((await call(role)).status).toBe(403);
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    const write = await call("admin", method);
    expect(write.status).toBe(403);
    expect((await write.json()).error).toContain("nothing can be changed");
  }
  // Without the header nothing changes for anyone.
  const plain = await fetch(base, { method: "POST" });
  expect(await plain.json()).toEqual({ as: null });
});
