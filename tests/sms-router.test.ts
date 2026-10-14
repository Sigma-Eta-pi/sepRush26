import { afterAll, beforeAll, expect, it, vi } from "vitest";
import express from "express";
import { createHmac } from "node:crypto";
import type { Server } from "node:http";
import { sampleWorkspace } from "../server/process/sample";
import { createSmsService } from "../server/sms/service";
import { smsRouter } from "../server/sms/router";
const f = sampleWorkspace();
let server: Server,
  base: string,
  version = 0;
const master = f.users.find(u => u.role === "master")!,
  pledge = f.users.find(u => u.role === "pledge")!;
const secret = "test-secret-".repeat(6);
const decode = vi
  .fn()
  .mockResolvedValue({
    id: "wire-1",
    phone: "+18055550123",
    text: "Some report",
    receivedAt: new Date().toISOString(),
  });
const service = createSmsService({
  users: async () => f.users,
  store: {
    read: async () => ({ version, data: structuredClone(f.doc) }),
    compareAndSwap: async (v, doc) => {
      if (v !== version) return false;
      version++;
      f.doc = doc;
      return true;
    },
  },
  extract: async () => ({
    intent: "other",
    pledgeName: null,
    reason: null,
    date: null,
    points: null,
  }),
  dailyLimit: 100,
});
beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use(
    "/sms",
    smsRouter({
      service,
      session: (req, res, next) => {
        if (!req.headers["x-test-user"]) {
          res.sendStatus(401);
          return;
        }
        next();
      },
      identity: req => String(req.headers["x-test-user"]),
      enabled: () => true,
      configured: () => true,
      secret: () => secret,
      decode,
    })
  );
  app.use((err: any, _req: any, res: any, _next: any) =>
    res.status(err.status || 500).json({ error: err.message })
  );
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as any).port}/sms`;
});
afterAll(() => server.close());
it("requires a signed relay and returns delivery receipts without source text", async () => {
  const send = (body: unknown) =>
    fetch(base + "/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  expect((await send({ text: "fake" })).status).toBe(401);
  expect(decode).not.toHaveBeenCalled();
  const timestamp = String(Date.now()),
    payload = JSON.stringify({ raw: "signed email" });
  const signature = createHmac("sha256", secret)
    .update(timestamp + "." + payload)
    .digest("hex");
  const response = await send({ timestamp, payload, signature });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    ok: true,
    id: "wire-1",
    status: "review",
    retry: false,
  });
});
it("denies anonymous and pledge inbox reads and mutations", async () => {
  expect((await fetch(base)).status).toBe(401);
  expect(
    (await fetch(base, { headers: { "x-test-user": pledge.id } })).status
  ).toBe(403);
  for (const [path, body] of [
    ["/binding", { userId: master.id, phone: "+18055550123", verified: true }],
    ["/resolve", { id: "wire-1", decision: "ignore" }],
    ["/retry", { id: "wire-1" }],
    ["/unbind", { userId: master.id }],
  ] as const) {
    expect(
      (
        await fetch(base + path, {
          method: "POST",
          headers: {
            "x-test-user": pledge.id,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        })
      ).status
    ).toBe(403);
  }
  expect(
    (await fetch(base, { headers: { "x-test-user": master.id } })).status
  ).toBe(200);
});
