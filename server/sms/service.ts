import { randomUUID } from "node:crypto";
import type { User } from "../../client/src/member-portal/types.js";
import type { SmsCandidate, SmsData, SmsItem } from "../../shared/sms.js";
import { applyAction, fail, type ProcessDocument } from "../process/engine.js";
import { isCalendarDate, isInstant } from "../process/dates.js";
import type { ProcessStore } from "../process/store.js";

export type IncomingText = {
  id: string;
  phone: string | null;
  text: string;
  receivedAt: string;
  demo?: boolean;
};
export type SmsExtractor = (
  text: string,
  receivedAt: string,
  timezone: string
) => Promise<SmsCandidate>;
type Doc = ProcessDocument & { sms?: SmsData };
export const smsData = (doc: Doc): SmsData =>
  (doc.sms ||= { items: [], bindings: [], usage: {} });
export function normalizePhone(value: string): string {
  const digits = value.replace(/[\s()+.-]/g, "");
  if (/^1\d{10}$/.test(digits)) return "+" + digits;
  if (/^\d{10}$/.test(digits)) return "+1" + digits;
  return fail("Use a US or Canadian number, including area code.");
}
const normalizedName = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
export function matchPledge(users: User[], name: string | null) {
  if (!name) return;
  const matches = users.filter(
    u =>
      !u.archived &&
      u.role === "pledge" &&
      [u.name, u.directoryName].some(
        n => n && normalizedName(n) === normalizedName(name)
      )
  );
  return matches.length === 1 ? matches[0] : undefined;
}
export function createSmsService(options: {
  store: ProcessStore;
  users: () => Promise<User[]>;
  extract: SmsExtractor;
  dailyLimit: number;
  now?: () => number;
}) {
  const now = options.now || Date.now;
  const stamp = () => new Date(now()).toISOString();
  const day = () => stamp().slice(0, 10);
  async function change<T>(
    fn: (doc: Doc, data: SmsData, users: User[]) => T
  ): Promise<T> {
    for (let i = 0; i < 6; i++) {
      const row = await options.store.read(),
        doc = structuredClone(row.data) as Doc;
      const result = fn(doc, smsData(doc), await options.users());
      if (await options.store.compareAndSwap(row.version, doc)) return result;
    }
    return fail("Another update is in progress. Retry shortly.", 409);
  }
  function master(users: User[], actorId: string) {
    if (
      !users.some(u => u.id === actorId && !u.archived && u.role === "master")
    )
      fail("Only pledge masters can manage text reports.", 403);
  }
  function reporter(data: SmsData, users: User[], item: SmsItem) {
    const binding = data.bindings.find(b => b.phone === item.phone);
    return users.find(
      u =>
        u.id === binding?.userId &&
        !u.archived &&
        ["active", "master"].includes(u.role)
    );
  }
  function report(
    doc: Doc,
    item: SmsItem,
    users: User[],
    actor: User,
    candidate: {
      pledgeId: string;
      reason: string;
      date: string;
      points: number;
    }
  ) {
    const before = new Set((doc.records.strike || []).map(s => s.id));
    applyAction(
      doc,
      users,
      actor,
      { type: "strike.report", ...candidate },
      { reportOnly: true }
    );
    const strike = doc.records.strike.find(s => !before.has(s.id));
    strike.source = "sms";
    strike.smsIntakeId = item.id;
    item.strikeId = strike.id;
    item.reporterId = actor.id;
    item.status = "reported";
    item.note = "Pending pledge-master approval.";
    doc.audit[0].source = "sms";
  }
  async function processItem(id: string): Promise<SmsItem> {
    const lease = randomUUID();
    const reserved = await change((doc, data, users) => {
      const item = data.items.find(x => x.id === id);
      if (!item) return fail("Text not found.", 404);
      if (item.status !== "failed" && item.status !== "processing")
        return { item: structuredClone(item) };
      if (item.leaseUntil && item.leaseUntil > now())
        return { item: structuredClone(item) };
      const sender = reporter(data, users, item);
      if (!sender) {
        item.status = "review";
        item.note = "Verify this sender’s number before creating a report.";
        return { item: structuredClone(item) };
      }
      if (item.attempts >= 3) {
        item.status = "review";
        item.note = "Automatic extraction failed three times. Review manually.";
        return { item: structuredClone(item) };
      }
      if ((data.usage[day()] || 0) >= options.dailyLimit) {
        item.status = "failed";
        item.note =
          "Daily AI limit reached. Retry tomorrow or review manually.";
        return { item: structuredClone(item) };
      }
      item.reporterId = sender.id;
      data.usage[day()] = (data.usage[day()] || 0) + 1;
      item.attempts++;
      item.status = "processing";
      item.lease = lease;
      item.leaseUntil = now() + 90000;
      return {
        item: structuredClone(item),
        timezone: doc.settings.timezone,
        run: true,
      };
    });
    if (!reserved.run) return reserved.item;
    let candidate: SmsCandidate | undefined;
    try {
      candidate = await options.extract(
        reserved.item.text,
        reserved.item.receivedAt,
        reserved.timezone!
      );
    } catch {
      /* Keep the source and retry state; do not expose provider responses. */
    }
    return change((doc, data, users) => {
      const item = data.items.find(x => x.id === id)!;
      if (item.lease !== lease || item.status !== "processing") return item;
      delete item.lease;
      delete item.leaseUntil;
      if (!candidate) {
        item.status = "failed";
        item.note = "AI extraction failed. Retry or review the original text.";
        return item;
      }
      item.candidate = candidate;
      const sender = reporter(data, users, item);
      if (!sender) {
        item.status = "review";
        item.note = "Sender access changed. Verify before creating a report.";
        return item;
      }
      item.reporterId = sender.id;
      if (candidate.intent === "other") {
        item.status = "ignored";
        item.note = "No strike report detected. Original text retained.";
        return item;
      }
      const pledge = matchPledge(users, candidate.pledgeName);
      if (
        candidate.intent !== "strike" ||
        !pledge ||
        !candidate.reason ||
        !isCalendarDate(candidate.date) ||
        (candidate.points !== null &&
          (!Number.isInteger(candidate.points) ||
            candidate.points < 1 ||
            candidate.points > 3))
      ) {
        item.status = "review";
        item.note = "Confirm the pledge, date and report details.";
        return item;
      }
      report(doc, item, users, sender, {
        pledgeId: pledge.id,
        reason: candidate.reason,
        date: candidate.date,
        points: candidate.points ?? 1,
      });
      return item;
    });
  }
  return {
    async receive(input: IncomingText) {
      if (
        !input.id ||
        input.id.length > 160 ||
        !input.text.trim() ||
        input.text.length > 6000 ||
        !isInstant(input.receivedAt) ||
        Date.parse(input.receivedAt) > now() + 300000
      )
        fail("Invalid incoming text.");
      await change((_doc, data) => {
        if (data.items.some(x => x.id === input.id)) return;
        data.items.unshift({
          ...input,
          importedAt: stamp(),
          status: "processing",
          attempts: 0,
          note: "Waiting for extraction.",
        });
        data.lastReceivedAt = stamp();
      });
      return processItem(input.id);
    },
    async inbox(actorId: string) {
      master(await options.users(), actorId);
      const data = smsData(structuredClone((await options.store.read()).data));
      return {
        items: data.items,
        bindings: data.bindings,
        lastReceivedAt: data.lastReceivedAt,
        callsToday: data.usage[day()] || 0,
        dailyLimit: options.dailyLimit,
      };
    },
    async bind(
      actorId: string,
      userId: string,
      phone: string,
      verified: boolean
    ) {
      return change((doc, data, users) => {
        master(users, actorId);
        if (!verified)
          fail("Confirm you verified the number directly with this member.");
        if (
          !users.some(
            u =>
              u.id === userId &&
              !u.archived &&
              ["active", "master"].includes(u.role)
          )
        )
          fail("Choose a current active or pledge master.");
        phone = normalizePhone(phone);
        if (data.bindings.some(b => b.phone === phone && b.userId !== userId))
          fail("That number is already linked to another member.", 409);
        data.bindings = data.bindings.filter(b => b.userId !== userId);
        data.bindings.push({
          phone,
          userId,
          verifiedBy: actorId,
          verifiedAt: stamp(),
        });
        doc.audit.unshift({
          id: randomUUID(),
          actor: actorId,
          action: "sms.bind",
          subject: "Texting number verified",
          at: stamp(),
          source: "sms",
        });
        return { ok: true };
      });
    },
    async unbind(actorId: string, userId: string) {
      return change((doc, data, users) => {
        master(users, actorId);
        data.bindings = data.bindings.filter(b => b.userId !== userId);
        doc.audit.unshift({
          id: randomUUID(),
          actor: actorId,
          action: "sms.unbind",
          subject: "Texting number removed",
          at: stamp(),
          source: "sms",
        });
        return { ok: true };
      });
    },
    async retry(actorId: string, id: string) {
      master(await options.users(), actorId);
      await change((_doc, data) => {
        const item = data.items.find(x => x.id === id);
        if (!item) fail("Text not found.", 404);
        if (item.status === "reported" || item.status === "ignored")
          fail("This text has already been handled.", 409);
        if (item.status === "review") item.status = "failed";
      });
      return processItem(id);
    },
    async resolve(
      actorId: string,
      id: string,
      decision: "ignore" | "report",
      fields?: {
        pledgeId: string;
        reason: string;
        date: string;
        points: number;
      }
    ) {
      return change((doc, data, users) => {
        master(users, actorId);
        const item = data.items.find(x => x.id === id);
        if (!item) fail("Text not found.", 404);
        if (item.status === "reported")
          fail("This text already has a strike report.", 409);
        if (decision === "ignore") {
          item.status = "ignored";
          item.note = "Dismissed from intake by a pledge master.";
        } else {
          const sender = reporter(data, users, item);
          if (!sender)
            fail("Verify the sender’s number before creating a report.");
          if (!fields) fail("Provide the report details.");
          report(doc, item, users, sender, fields);
        }
        delete item.lease;
        delete item.leaseUntil;
        doc.audit.unshift({
          id: randomUUID(),
          actor: actorId,
          action: "sms.resolve",
          subject:
            decision === "ignore"
              ? "Text intake dismissed"
              : "Text converted to pending report",
          at: stamp(),
          source: "sms",
        });
        return { ok: true };
      });
    },
  };
}
export type SmsService = ReturnType<typeof createSmsService>;
