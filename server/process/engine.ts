import { randomUUID } from "node:crypto";
import { isCalendarDate, isInstant, isProcessDate } from "./dates.js";
import type {
  User,
  Settings,
  State,
} from "../../client/src/member-portal/types.js";
export type ProcessDocument = {
  settings: Settings;
  records: Record<string, any[]>;
  audit: any[];
};
export function fail(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}
const text = (v: unknown, label: string, max = 2000): string => {
  if (typeof v !== "string" || !v.trim() || v.length > max)
    fail(`${label} is required (up to ${max} characters).`);
  return v.trim();
};
const date = (
  v: unknown,
  kind: "date" | "instant" | "either" = "either"
): string => {
  const valid =
    kind === "date"
      ? isCalendarDate(v)
      : kind === "instant"
        ? isInstant(v)
        : isProcessDate(v);
  if (!valid)
    fail(
      kind === "instant"
        ? "Choose a valid date and time with a timezone."
        : "Choose a valid date."
    );
  return v as string;
};
const integer = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max)
    fail(`Choose a whole number between ${min} and ${max}.`);
  return n;
};
const link = (v: string) => {
  try {
    const u = new URL(v);
    if (!["http:", "https:"].includes(u.protocol)) throw 0;
    return u.href;
  } catch {
    return fail("Enter a complete http or https link.");
  }
};
export const defaultCoffeeTarget = 35;
export function emptyDocument(): ProcessDocument {
  return {
    settings: {
      chapter: "Sigma Eta Pi · UCSB",
      cohort: "New members",
      term: "Fall 2026",
      startDate: "2026-10-05",
      endDate: "2026-12-05",
      coffeeGoal: defaultCoffeeTarget,
      timezone: "America/Los_Angeles",
      welcome: "Your next steps, together.",
      announcement:
        "Pledge masters can add the confirmed schedule and process details in Settings.",
    },
    records: {},
    audit: [],
  };
}
export function applyAction(
  doc: ProcessDocument,
  users: User[],
  u: User,
  b: Record<string, any>,
  options: { reportOnly?: boolean } = {}
) {
  const currentActor = users.find(
    member => member.id === u.id && !member.archived
  );
  if (!currentActor || u.archived) fail("Member access required.", 403);
  u = currentActor;
  const type = text(b.type, "Action", 80);
  const master = () => {
    if (u.role !== "master") fail("Only pledge masters can do that.", 403);
  };
  const staff = () => {
    if (u.role === "pledge")
      fail("Only actives and pledge masters can do that.", 403);
  };
  const pledge = () => {
    if (u.role !== "pledge") fail("Only pledges can do that.", 403);
  };
  const member = (id: string, role?: string): User => {
    const m = users.find(x => x.id === id);
    if (!m || (role && (m.role !== role || m.archived)))
      fail("Choose a valid member.");
    return m;
  };
  const collection = (kind: string): any[] => doc.records[kind] || [];
  const get = (id: string, kind: string) => {
    const r = collection(kind).find(x => x.id === id);
    if (!r) fail("This item was not found.", 404);
    return r;
  };
  const save = (kind: string, row: any) => {
    doc.records[kind] = [...collection(kind).filter(x => x.id !== row.id), row];
  };
  const assignMakeup = (task: any, strikeId?: string, pledgeId?: string) => {
    if (Date.parse(task.dueAt) < Date.now())
      fail("This task deadline has passed.");
    if (!strikeId) {
      master();
      member(pledgeId || "", "pledge");
      task.status = "claimed";
      task.pledgeId = pledgeId;
      task.strikeId = null;
      return;
    }
    const strike = get(strikeId, "strike");
    member(strike.pledgeId, "pledge");
    if (
      strike.status !== "approved" ||
      (pledgeId && strike.pledgeId !== pledgeId)
    )
      fail("Choose an approved strike for this pledge.");
    if (Date.parse(task.dueAt) < Date.now())
      fail("This task deadline has passed.");
    const committed = collection("makeup")
      .filter(
        x =>
          x.strikeId === strike.id &&
          [
            "claimed",
            "changes_requested",
            "submitted",
            "verified",
            "approved",
          ].includes(x.status)
      )
      .reduce((sum, x) => sum + x.credit, 0);
    if (committed + task.credit > strike.points)
      fail("This strike already has enough makeup work assigned.");
    task.status = "claimed";
    task.pledgeId = strike.pledgeId;
    task.strikeId = strike.id;
  };
  const cancelMakeups = (strikeId: string) => {
    for (const task of collection("makeup").filter(
      t =>
        t.strikeId === strikeId &&
        !["approved", "rejected", "cancelled"].includes(t.status)
    )) {
      task.status = "cancelled";
      task.reviewNote =
        "The linked strike was dismissed; no further makeup work is needed.";
    }
  };
  const id = randomUUID(),
    now = new Date().toISOString();
  let subject = "";
  switch (type) {
    case "event.create":
    case "event.update": {
      master();
      const old = type.endsWith("update") ? get(b.id, "event") : null;
      const startsAt = date(b.startsAt, "instant"),
        endsAt = date(b.endsAt, "instant");
      if (Date.parse(endsAt) <= Date.parse(startsAt))
        fail("End time must be after start time.");
      if (!["chapter", "workshop", "social", "milestone"].includes(b.eventType))
        fail("Choose an event type.");
      const e = {
        id: old?.id || id,
        title: text(b.title, "Title", 120),
        startsAt,
        endsAt,
        location: text(b.location, "Location", 200),
        description: text(b.description, "Description"),
        type: b.eventType,
        ownerId: old?.ownerId || u.id,
        rsvps: old?.rsvps || {},
      };
      save("event", e);
      subject = e.title;
      break;
    }
    case "event.rsvp": {
      const e = get(b.id, "event");
      if (!["going", "unavailable"].includes(b.status))
        fail("Choose your availability.");
      e.rsvps[u.id] = b.status;
      save("event", e);
      subject = e.title;
      break;
    }
    case "coffee.log": {
      pledge();
      const pledgeId = u.id;
      const active = member(b.activeId);
      if (active.role === "pledge" || active.archived)
        fail("Choose an active.");
      const activeId = active.id;
      if (
        collection("coffee").some(
          c =>
            c.pledgeId === pledgeId &&
            c.activeId === activeId &&
            c.status !== "declined"
        )
      )
        fail("This chat has already been recorded.", 409);
      const met = date(b.date);
      if (Date.parse(met) > Date.now()) fail("Record a chat after you meet.");
      save("coffee", {
        id,
        pledgeId,
        activeId,
        status: "pending",
        date: met,
        location: "",
        note: text(b.note, "Your thank-you message", 1000),
        reviewNote: "",
        createdAt: now,
      });
      subject = "Coffee chat recorded";
      break;
    }
    case "coffee.update": {
      const c = get(b.id, "coffee");
      if (c.activeId !== u.id)
        fail("Only this active can confirm or reject their chat.", 403);
      if (
        c.status !== "pending" ||
        !["complete", "declined"].includes(b.status)
      )
        fail("This chat has already changed.", 409);
      c.status = b.status;
      c.reviewNote =
        b.status === "declined" && typeof b.note === "string"
          ? b.note.trim().slice(0, 500)
          : "";
      save("coffee", c);
      subject =
        b.status === "complete"
          ? "Coffee chat confirmed"
          : "Coffee chat rejected";
      break;
    }
    case "strike.report": {
      staff();
      member(b.pledgeId, "pledge");
      const s = {
        id,
        pledgeId: b.pledgeId,
        reporterId: u.id,
        reason: text(b.reason, "What happened"),
        date: date(b.date),
        status:
          u.role === "master" && !options.reportOnly ? "approved" : "reported",
        points: integer(b.points, 1, 3),
        reviewNote: "",
        appeal: "",
        appealStatus: "",
        createdAt: now,
      };
      save("strike", s);
      subject = `${u.role === "master" && !options.reportOnly ? "Strike issued" : "Strike report"} · ${member(b.pledgeId).name}`;
      break;
    }
    case "strike.review": {
      master();
      const s = get(b.id, "strike");
      if (s.status !== "reported")
        fail("This report has already been reviewed.", 409);
      if (!["approved", "dismissed"].includes(b.status))
        fail("Choose a review outcome.");
      s.status = b.status;
      s.reviewNote = text(b.note, "Review explanation");
      save("strike", s);
      subject = `Strike reviewed · ${member(s.pledgeId).name}`;
      break;
    }
    case "strike.dismiss": {
      master();
      const s = get(b.id, "strike");
      if (s.status !== "approved")
        fail("Only an issued strike can be dismissed.", 409);
      s.status = "dismissed";
      s.reviewNote = text(b.note, "Reason for dismissal");
      if (s.appealStatus === "pending") s.appealStatus = "dismissed";
      save("strike", s);
      cancelMakeups(s.id);
      subject = `Strike dismissed · ${member(s.pledgeId).name}`;
      break;
    }
    case "strike.appeal": {
      pledge();
      const s = get(b.id, "strike");
      if (s.pledgeId !== u.id)
        fail("You can only respond to your own report.", 403);
      if (s.status !== "approved" || s.appealStatus)
        fail("This report cannot be appealed again.");
      s.appeal = text(b.note, "Your explanation");
      s.appealStatus = "pending";
      save("strike", s);
      subject = "Strike response submitted";
      break;
    }
    case "strike.appealReview": {
      master();
      const s = get(b.id, "strike");
      if (s.appealStatus !== "pending") fail("No response is awaiting review.");
      if (!["upheld", "dismissed"].includes(b.status))
        fail("Choose an outcome.");
      s.appealStatus = b.status;
      s.reviewNote = text(b.note, "Review explanation");
      if (b.status === "dismissed") {
        s.status = "dismissed";
        cancelMakeups(s.id);
      }
      save("strike", s);
      subject = "Strike response reviewed";
      break;
    }
    case "makeup.offer": {
      staff();
      const t = {
        id,
        title: text(b.title, "Task title", 120),
        description: text(b.description, "Description"),
        ownerId: u.id,
        dueAt: date(b.dueAt, "instant"),
        credit: integer(b.credit, 1, 3),
        status: u.role === "master" ? "open" : "proposed",
        pledgeId: null,
        strikeId: null,
        evidence: "",
        reviewNote: "",
      };
      if (Date.parse(t.dueAt) <= Date.now())
        fail("This task deadline has passed.");
      if (b.strikeId || b.pledgeId) {
        master();
        assignMakeup(t, b.strikeId, b.pledgeId);
      }
      save("makeup", t);
      subject = t.title;
      break;
    }
    case "makeup.assign": {
      master();
      const t = get(b.id, "makeup");
      if (t.status !== "open")
        fail("Only available makeup tasks can be assigned.", 409);
      assignMakeup(t, b.strikeId, b.pledgeId);
      save("makeup", t);
      subject = t.title;
      break;
    }
    case "makeup.approveOffer": {
      master();
      const t = get(b.id, "makeup");
      if (t.status !== "proposed")
        fail("This task has already been reviewed.", 409);
      if (!["open", "rejected"].includes(b.status))
        fail("Choose a review outcome.");
      if (b.status === "open" && Date.parse(t.dueAt) <= Date.now())
        fail("This task deadline has passed.");
      t.status = b.status;
      save("makeup", t);
      subject = t.title;
      break;
    }
    case "makeup.claim": {
      pledge();
      const t = get(b.id, "makeup");
      if (t.status !== "open") fail("This task has already been claimed.", 409);
      assignMakeup(t, b.strikeId, u.id);
      save("makeup", t);
      subject = t.title;
      break;
    }
    case "makeup.submit": {
      pledge();
      const t = get(b.id, "makeup");
      if (
        t.pledgeId !== u.id ||
        !["claimed", "changes_requested"].includes(t.status)
      )
        fail("This task cannot be submitted.", 403);
      t.evidence = text(b.evidence, "What you completed");
      t.status = "submitted";
      save("makeup", t);
      subject = t.title;
      break;
    }
    case "makeup.review": {
      const t = get(b.id, "makeup");
      if (u.role !== "master" && t.ownerId !== u.id)
        fail("Only the task owner or pledge master can review this work.", 403);
      if (!["submitted", "verified", "completed"].includes(t.status))
        fail("This work is not awaiting review.");
      if (["verified", "completed"].includes(t.status) && u.role !== "master")
        fail("A pledge master must award the credit.", 403);
      if (!["approved", "changes_requested"].includes(b.status))
        fail("Choose a review outcome.");
      // A master can attach an approved strike when awarding credit later.
      // Until then, completed work is retained without reducing any balance.
      let linked = t.strikeId ? get(t.strikeId, "strike") : null;
      if (b.strikeId && b.strikeId !== t.strikeId) {
        master();
        if (t.strikeId) fail("This makeup already has a linked strike.");
        if (b.status !== "approved")
          fail("Link a strike when approving credit.");
        member(t.pledgeId, "pledge");
        const candidate = get(b.strikeId, "strike");
        if (
          candidate.status !== "approved" ||
          candidate.pledgeId !== t.pledgeId
        )
          fail("Choose an approved strike for this pledge.");
        const reserved = collection("makeup")
          .filter(
            other =>
              other.id !== t.id &&
              other.strikeId === candidate.id &&
              [
                "claimed",
                "changes_requested",
                "submitted",
                "verified",
                "approved",
              ].includes(other.status)
          )
          .reduce((sum, other) => sum + other.credit, 0);
        if (reserved + t.credit > candidate.points)
          fail("This strike already has enough makeup work assigned.", 409);
        linked = candidate;
      }
      if (b.status === "approved" && linked && linked.status !== "approved")
        fail(
          "The linked strike is no longer outstanding. No credit is needed."
        );
      if (linked && linked.pledgeId !== t.pledgeId)
        fail("The makeup and strike must belong to the same pledge.");
      if (b.status === "approved" && linked) {
        const credited = collection("makeup")
          .filter(
            other =>
              other.id !== t.id &&
              other.strikeId === linked.id &&
              other.status === "approved"
          )
          .reduce((sum, other) => sum + other.credit, 0);
        if (credited + t.credit > linked.points)
          fail("This strike already has enough approved makeup credit.", 409);
      }
      const reviewNote = text(b.note, "Feedback");
      t.strikeId = linked?.id || null;
      t.status =
        b.status === "approved"
          ? u.role === "master"
            ? linked
              ? "approved"
              : "completed"
            : "verified"
          : "changes_requested";
      t.reviewNote = reviewNote;
      save("makeup", t);
      subject = t.title;
      break;
    }
    case "deliverable.create":
    case "deliverable.update": {
      master();
      const old = type.endsWith("update") ? get(b.id, "deliverable") : null;
      const d = {
        id: old?.id || id,
        title: text(b.title, "Title", 120),
        description: text(b.description, "Instructions"),
        dueAt: date(b.dueAt, "instant"),
        ownerId: old?.ownerId || u.id,
      };
      save("deliverable", d);
      subject = d.title;
      break;
    }
    case "deliverable.submit": {
      pledge();
      const d = get(b.id, "deliverable");
      const old = collection("submission").find(
        s => s.deliverableId === d.id && s.pledgeId === u.id
      );
      if (old && ["submitted", "approved"].includes(old.status))
        fail("Your work has already been submitted.");
      const s = {
        id: old?.id || id,
        deliverableId: d.id,
        pledgeId: u.id,
        url: link(b.url),
        note: typeof b.note === "string" ? b.note.slice(0, 2000) : "",
        status: "submitted",
        feedback: "",
        submittedAt: now,
      };
      save("submission", s);
      subject = d.title;
      break;
    }
    case "deliverable.review": {
      master();
      const s = get(b.id, "submission");
      if (s.status !== "submitted")
        fail("This submission is not awaiting review.");
      if (!["approved", "changes_requested"].includes(b.status))
        fail("Choose an outcome.");
      s.status = b.status;
      s.feedback = text(b.note, "Feedback");
      save("submission", s);
      subject = `Deliverable · ${member(s.pledgeId).name}`;
      break;
    }
    case "question.create": {
      const q = {
        id,
        title: text(b.title, "Question", 160),
        body: text(b.body, "Details", 4000),
        authorId: u.id,
        private: b.private === true,
        resolved: false,
        createdAt: now,
        replies: [],
      };
      save("question", q);
      subject = q.private ? "Private question submitted" : q.title;
      break;
    }
    case "question.reply": {
      const q = get(b.id, "question");
      if (q.private && u.role !== "master" && q.authorId !== u.id)
        fail("This question is private.", 403);
      if (u.role !== "master" && q.authorId !== u.id)
        fail("Only pledge masters and the author can reply.", 403);
      q.replies.push({
        id,
        authorId: u.id,
        body: text(b.body, "Reply", 4000),
        createdAt: now,
      });
      q.resolved = false;
      save("question", q);
      subject = q.private ? "Private question reply" : q.title;
      break;
    }
    case "question.resolve": {
      master();
      const q = get(b.id, "question");
      q.resolved = !q.resolved;
      save("question", q);
      subject = q.private ? "Private question updated" : q.title;
      break;
    }
    case "settings.update": {
      master();
      const old = doc.settings;
      const startDate = date(b.startDate, "date"),
        endDate = date(b.endDate, "date");
      if (Date.parse(endDate) <= Date.parse(startDate))
        fail("The process end must follow its start.");
      const s = {
        ...old,
        cohort: text(b.cohort, "Class name", 80),
        term: text(b.term, "Term", 80),
        chapter: text(b.chapter, "Chapter", 120),
        startDate,
        endDate,
        coffeeTarget:
          b.coffeeGoal === undefined
            ? old.coffeeTarget
            : integer(b.coffeeGoal, 1, 100),
        welcome: text(b.welcome, "Welcome title", 120),
        announcement: text(b.announcement, "Announcement", 2000),
      };
      doc.settings = s;
      subject = "Process settings updated";
      break;
    }
    default:
      fail("Unknown action.");
  }
  doc.audit = [
    { id: Date.now(), actor: u.id, action: type, subject, at: now },
    ...doc.audit,
  ].slice(0, 2000);
  return { ok: true, id };
}
export function snapshot(
  doc: ProcessDocument,
  users: User[],
  u: User,
  demo = false
): State {
  const currentActor = users.find(
    member => member.id === u.id && !member.archived
  );
  if (!currentActor || u.archived) fail("Member access required.", 403);
  u = currentActor;
  const archivedUsers = users.filter(member => member.archived);
  users = users.filter(member => !member.archived);
  const currentIds = new Set(users.map(member => member.id));
  const rows = (kind: string): any[] =>
    (doc.records[kind] || []).filter(
      row =>
        !["coffee", "submission", "makeup"].includes(kind) ||
        ((!row.pledgeId || currentIds.has(row.pledgeId)) &&
          (!row.activeId || currentIds.has(row.activeId)))
    );
  const master = u.role === "master",
    own = (x: any) => master || x.pledgeId === u.id;
  return {
    user: u,
    archivedUsers: u.role === "master" ? archivedUsers : undefined,
    users,
    settings: {
      ...doc.settings,
      // Each pledge meets a set number of actives, never more than exist.
      coffeeTarget: doc.settings.coffeeTarget ?? defaultCoffeeTarget,
      coffeeGoal: Math.min(
        users.filter(x => x.role !== "pledge").length,
        doc.settings.coffeeTarget ?? defaultCoffeeTarget
      ),
    },
    events: rows("event"),
    // Everyone on staff sees who met whom; the thank-you stays between the
    // pledge, their active and the pledge masters.
    coffee: rows("coffee")
      .filter(c => u.role !== "pledge" || c.pledgeId === u.id)
      .map(c =>
        master || c.pledgeId === u.id || c.activeId === u.id
          ? c
          : { ...c, note: "", reviewNote: "" }
      ),
    strikes: rows("strike").filter(s => own(s) || s.reporterId === u.id),
    makeups: rows("makeup")
      .filter(
        t =>
          (t.status !== "proposed" && t.status !== "rejected") ||
          master ||
          t.ownerId === u.id
      )
      .map(t =>
        master || t.ownerId === u.id || t.pledgeId === u.id
          ? t
          : {
              ...t,
              evidence: "",
              reviewNote: "",
              strikeId: rows("strike").some(
                strike => strike.id === t.strikeId && strike.reporterId === u.id
              )
                ? t.strikeId
                : null,
            }
      ),
    deliverables: rows("deliverable"),
    submissions: rows("submission").filter(own),
    questions: rows("question").filter(
      q => !q.private || master || q.authorId === u.id
    ),
    classProgress: users
      .filter(
        p => p.role === "pledge" && (u.role !== "pledge" || p.id === u.id)
      )
      .map(p => ({
        pledgeId: p.id,
        approvedDeliverables: new Set(
          rows("submission")
            .filter(
              s =>
                s.pledgeId === p.id &&
                s.status === "approved" &&
                rows("deliverable").some(d => d.id === s.deliverableId)
            )
            .map(s => s.deliverableId)
        ).size,
      })),
    audit: master ? doc.audit.slice(0, 30) : [],
    demo,
  };
}
