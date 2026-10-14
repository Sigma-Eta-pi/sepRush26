import { describe, it, expect, vi } from "vitest";
import { sampleWorkspace } from "../server/process/sample";
import { applyAction, snapshot } from "../server/process/engine";
import { strikeBalance } from "../client/src/member-portal/lib";
import {
  createSmsService,
  matchPledge,
  normalizePhone,
} from "../server/sms/service";
import { candidateSchema } from "../server/sms/extractor";
import { createHmac } from "node:crypto";
import { verifyRelay } from "../server/sms/voice";
const fixture = (limit = 100) => {
  const f = sampleWorkspace();
  let version = 0,
    clock = Date.parse("2026-10-06T18:00:00Z");
  const master = f.users.find(u => u.role === "master")!,
    active = f.users.find(u => u.role === "active")!,
    pledge = f.users.find(u => u.role === "pledge")!;
  const extract = vi
    .fn()
    .mockResolvedValue({
      intent: "strike",
      pledgeName: pledge.name,
      reason: "Late to meeting",
      date: "2026-10-06",
      points: null,
    });
  const service = createSmsService({
    users: async () => f.users,
    store: {
      read: async () => ({ version, data: structuredClone(f.doc) }),
      compareAndSwap: async (v, doc) => {
        if (v !== version) return false;
        f.doc = doc;
        version++;
        return true;
      },
    },
    extract,
    dailyLimit: limit,
    now: () => clock,
  });
  const incoming = (id = "message-1") => ({
    id,
    phone: "+18055550101",
    text: "Give a strike for being late today",
    receivedAt: "2026-10-06T17:00:00Z",
  });
  return {
    f,
    service,
    extract,
    master,
    active,
    pledge,
    incoming,
    advance: (ms: number) => {
      clock += ms;
    },
  };
};
describe("Text intake and master approval", () => {
  it.each(["active", "master"])(
    "keeps %s texts pending and duplicate retries create only one report",
    async role => {
      const t = fixture(),
        reporter = role === "active" ? t.active : t.master;
      await t.service.bind(t.master.id, reporter.id, t.incoming().phone, true);
      const before = strikeBalance(
        snapshot(t.f.doc, t.f.users, t.master),
        t.pledge.id
      );
      const results = await Promise.all([
        t.service.receive(t.incoming()),
        t.service.receive(t.incoming()),
      ]);
      const item = (await t.service.inbox(t.master.id)).items[0];
      expect(item.status).toBe("reported");
      expect(t.extract).toHaveBeenCalledTimes(1);
      expect(
        t.f.doc.records.strike.filter(s => s.smsIntakeId === item.id)
      ).toHaveLength(1);
      expect(
        strikeBalance(snapshot(t.f.doc, t.f.users, t.master), t.pledge.id)
      ).toBe(before);
      expect(
        t.f.doc.records.strike.find(s => s.id === item.strikeId).reporterId
      ).toBe(reporter.id);
      applyAction(t.f.doc, t.f.users, t.master, {
        type: "strike.review",
        id: item.strikeId,
        status: "approved",
        note: "Verified with reporter",
      });
      expect(
        strikeBalance(snapshot(t.f.doc, t.f.users, t.master), t.pledge.id)
      ).toBe(before + 1);
      await t.service.receive(t.incoming());
      expect(t.extract).toHaveBeenCalledTimes(1);
    }
  );
  it("requires independently verified numbers and enforces master-only inbox access", async () => {
    const t = fixture();
    t.active.phone = t.incoming().phone;
    expect((await t.service.receive(t.incoming())).status).toBe("review");
    expect(t.extract).not.toHaveBeenCalled();
    await expect(t.service.inbox(t.pledge.id)).rejects.toMatchObject({
      status: 403,
    });
    await expect(
      t.service.bind(t.active.id, t.active.id, t.incoming().phone, true)
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      t.service.bind(t.master.id, t.active.id, t.incoming().phone, false)
    ).rejects.toThrow("Confirm");
    await t.service.bind(t.master.id, t.active.id, t.incoming().phone, true);
    expect((await t.service.retry(t.master.id, "message-1")).status).toBe(
      "reported"
    );
  });
  it("holds ambiguous names, missing dates and unknown senders for clarification", async () => {
    const t = fixture();
    await t.service.bind(t.master.id, t.active.id, t.incoming().phone, true);
    t.extract.mockResolvedValue({
      intent: "strike",
      pledgeName: "Alex",
      reason: "Late",
      date: null,
      points: null,
    });
    expect((await t.service.receive(t.incoming())).status).toBe("review");
    expect(matchPledge(t.f.users, t.pledge.name.split(" ")[0])).toBeUndefined();
    await t.service.resolve(t.master.id, "message-1", "report", {
      pledgeId: t.pledge.id,
      reason: "Confirmed reason",
      date: "2026-10-05",
      points: 2,
    });
    const item = (await t.service.inbox(t.master.id)).items[0];
    expect(
      t.f.doc.records.strike.find(s => s.id === item.strikeId).status
    ).toBe("reported");
    await expect(
      t.service.resolve(t.master.id, item.id, "report", {
        pledgeId: t.pledge.id,
        reason: "Again",
        date: "2026-10-05",
        points: 2,
      })
    ).rejects.toMatchObject({ status: 409 });
  });
  it("limits paid retries, preserves failures and ignores non-report messages", async () => {
    const t = fixture(1);
    await t.service.bind(t.master.id, t.active.id, t.incoming().phone, true);
    t.extract.mockRejectedValue(new Error("Provider failure"));
    expect((await t.service.receive(t.incoming())).status).toBe("failed");
    await t.service.retry(t.master.id, "message-1");
    expect(t.extract).toHaveBeenCalledTimes(1);
    t.advance(86400000);
    t.extract.mockResolvedValue({
      intent: "other",
      pledgeName: null,
      reason: null,
      date: null,
      points: null,
    });
    expect((await t.service.retry(t.master.id, "message-1")).status).toBe(
      "ignored"
    );
  });
  it("revalidates member status after extraction and blocks archived reporters", async () => {
    const t = fixture();
    await t.service.bind(t.master.id, t.active.id, t.incoming().phone, true);
    t.extract.mockImplementation(async () => {
      t.active.archived = true;
      return {
        intent: "strike",
        pledgeName: t.pledge.name,
        reason: "Late",
        date: "2026-10-06",
        points: 1,
      };
    });
    expect((await t.service.receive(t.incoming())).status).toBe("review");
    await expect(
      t.service.resolve(t.master.id, "message-1", "report", {
        pledgeId: t.pledge.id,
        reason: "Late",
        date: "2026-10-06",
        points: 1,
      })
    ).rejects.toThrow("Verify");
  });
  it("does not expose text intake through pledge process snapshots", async () => {
    const t = fixture();
    await t.service.receive(t.incoming());
    expect(snapshot(t.f.doc, t.f.users, t.pledge)).not.toHaveProperty("sms");
  });
});
it("verifies relay signatures, time windows and payload integrity", () => {
  const secret = "a".repeat(64),
    timestamp = String(Date.now()),
    payload = JSON.stringify({ raw: "test" });
  const signature = createHmac("sha256", secret)
    .update(timestamp + "." + payload)
    .digest("hex");
  expect(verifyRelay({ payload, timestamp, signature }, secret)).toEqual({
    raw: "test",
  });
  expect(() =>
    verifyRelay({ payload: payload + " ", timestamp, signature }, secret)
  ).toThrow("authentication");
  expect(() =>
    verifyRelay(
      { payload, timestamp, signature },
      secret,
      Number(timestamp) + 600000
    )
  ).toThrow("authentication");
  expect(() => verifyRelay({ payload, timestamp, signature }, "")).toThrow(
    "configured"
  );
});
it("validates structured AI output and never accepts role or approval instructions", () => {
  expect(() =>
    candidateSchema.parse({
      intent: "strike",
      pledgeName: "Alex",
      reason: "Late",
      date: "2026-10-06",
      points: 50,
    })
  ).toThrow();
  expect(() =>
    candidateSchema.parse({
      intent: "strike",
      pledgeName: "Alex",
      reason: "Late",
      date: "2026-10-06",
      points: 1,
      status: "approved",
      reporterId: "master",
    })
  ).toThrow();
  expect(normalizePhone("(805) 555-0101")).toBe("+18055550101");
});
