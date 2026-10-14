import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import express from "express";
import type { Server } from "node:http";
import {
  applyProfileEdit,
  ownProfileRouter,
  validateProfileEdit,
} from "../server/process/profile-edit";
import type { User } from "../client/src/member-portal/types";
let users: User[], saved: string[], server: Server, base: string;
const fixture = (id: string, role: User["role"]): User => ({
  id,
  role,
  name: id,
  major: "",
  year: "",
  color: "blue",
  pledgeClass: "Alpha",
});
beforeEach(() => {
  users = [
    fixture("master", "master"),
    fixture("active", "active"),
    fixture("pledge", "pledge"),
    fixture("other", "pledge"),
  ];
  saved = [];
});
beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use(
    "/profile",
    ownProfileRouter({
      current: req =>
        users.find(u => u.id === req.header("x-user") && !u.archived),
      members: () => users,
      save: (id, edit) => {
        saved.push(id);
        users = users.map(u => (u.id === id ? applyProfileEdit(u, edit) : u));
      },
      archive: (id, archived) => {
        users.find(u => u.id === id)!.archived = archived;
      },
    })
  );
  app.use((e: any, _req: any, res: any, _next: any) =>
    res.status(e.status || 500).json({ error: e.message })
  );
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as any).port}/profile`;
});
afterAll(() => server.close());
const request = (path: string, user: string, method: string, body?: object) =>
  fetch(base + path, {
    method,
    headers: { "x-user": user, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
it("persists editable class, tags, clears, and supplemental details on the authenticated member only", async () => {
  const body = {
    name: "Updated Member",
    pledgeClass: "Founder",
    profileTags: ["Design", "Climbing"],
    phone: "",
    profileSections: [{ title: "Hobbies", body: "Running" }],
  };
  expect((await request("", "pledge", "PUT", body)).status).toBe(200);
  const profile = await (await request("", "pledge", "GET")).json();
  expect(profile.pledgeClass).toBe("Founder");
  expect(profile.profileTags).toEqual(body.profileTags);
  expect(profile.phone).toBe("");
  expect(profile.role).toBe("pledge");
  expect(saved).toEqual(["pledge"]);
});
it("rejects spoofed IDs, roles, and class-based privilege escalation", async () => {
  expect(
    (await request("", "active", "PUT", { id: "other", role: "master" })).status
  ).toBe(400);
  expect(
    (await request("/pledges/other", "active", "PUT", { name: "Tampered" }))
      .status
  ).toBe(403);
  expect((await request("/pledges/other", "pledge", "DELETE")).status).toBe(
    403
  );
  expect(saved).toEqual([]);
});
it("lets a master edit and reversibly remove pledges but not actives or other masters", async () => {
  expect(
    (
      await request("/pledges/pledge", "master", "PUT", {
        pledgeClass: "Founding",
      })
    ).status
  ).toBe(200);
  expect(
    (await request("/pledges/active", "master", "PUT", { name: "No" })).status
  ).toBe(404);
  expect((await request("/pledges/pledge", "master", "DELETE")).status).toBe(
    200
  );
  expect((await request("", "pledge", "GET")).status).toBe(403);
  expect(
    (await request("/pledges/pledge/restore", "master", "POST")).status
  ).toBe(200);
  expect((await (await request("", "pledge", "GET")).json()).pledgeClass).toBe(
    "Founding"
  );
});
it("rejects unsafe images and markup-bearing role fields while preserving image removals", () => {
  expect(() =>
    validateProfileEdit({ photoUrl: "javascript:alert(1)" })
  ).toThrow();
  expect(() =>
    validateProfileEdit({ coverUrl: "data:image/svg+xml;base64,AAAA" })
  ).toThrow();
  expect(() =>
    validateProfileEdit({
      profileSections: [{ title: "Role", body: "master" }],
    })
  ).toThrow();
  const result = applyProfileEdit(fixture("pledge", "pledge"), {
    photoUrl: "",
  });
  expect(result.photoEdited).toBe(true);
  expect(result.photoUrl).toBe("");
});
