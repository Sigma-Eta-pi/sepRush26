import { describe, it, expect } from "vitest";
import { applyAction, snapshot } from "../server/process/engine";
import { sampleWorkspace } from "../server/process/sample";
const setup = () => {
  const { users, doc } = sampleWorkspace();
  return {
    users,
    doc,
    master: users[0],
    active: users[2],
    stranger: users[8],
    pledge: users[57],
    other: users[58],
  };
};
describe("Complete process action permission matrix", () => {
  const masterOnly = [
    "event.create",
    "event.update",
    "strike.review",
    "strike.dismiss",
    "strike.appealReview",
    "makeup.approveOffer",
    "makeup.assign",
    "deliverable.create",
    "deliverable.update",
    "deliverable.review",
    "question.resolve",
    "settings.update",
  ];
  for (const type of masterOnly)
    for (const role of ["active", "pledge"] as const)
      it(`${role} cannot ${type}`, () => {
        const f = setup();
        const before = structuredClone(f.doc);
        expect(() => applyAction(f.doc, f.users, f[role], { type })).toThrow(
          "Only pledge masters"
        );
        expect(f.doc).toEqual(before);
      });
  for (const type of ["strike.report", "makeup.offer"])
    it(`pledge cannot ${type}`, () => {
      const f = setup();
      expect(() => applyAction(f.doc, f.users, f.pledge, { type })).toThrow(
        "Only actives"
      );
    });
  for (const type of [
    "strike.appeal",
    "makeup.claim",
    "makeup.submit",
    "deliverable.submit",
  ])
    for (const role of ["master", "active"] as const)
      it(`${role} cannot perform pledge-only ${type}`, () => {
        const f = setup();
        expect(() => applyAction(f.doc, f.users, f[role], { type })).toThrow(
          "Only pledges"
        );
      });
  it("issues, appeals, dismisses and cancels unfinished makeup without erasing history", () => {
    const f = setup();
    applyAction(f.doc, f.users, f.pledge, {
      type: "strike.appeal",
      id: "strike-2",
      note: "A scheduling conflict",
    });
    applyAction(f.doc, f.users, f.master, {
      type: "strike.appealReview",
      id: "strike-2",
      status: "dismissed",
      note: "Conflict confirmed",
    });
    expect(f.doc.records.strike.find(x => x.id === "strike-2").status).toBe(
      "dismissed"
    );
    expect(f.doc.records.makeup.find(x => x.id === "makeup-3").status).toBe(
      "cancelled"
    );
    expect(() =>
      applyAction(f.doc, f.users, f.active, {
        type: "makeup.review",
        id: "makeup-3",
        status: "approved",
        note: "Done",
      })
    ).toThrow("not awaiting review");
    applyAction(f.doc, f.users, f.master, {
      type: "strike.dismiss",
      id: "strike-3",
      note: "Issued in error",
    });
    expect(f.doc.records.strike.find(x => x.id === "strike-3").reviewNote).toBe(
      "Issued in error"
    );
  });
  it("restricts makeup verification to its owner and final credit to a master", () => {
    const f = setup();
    expect(() =>
      applyAction(f.doc, f.users, f.stranger, {
        type: "makeup.review",
        id: "makeup-3",
        status: "approved",
        note: "Test",
      })
    ).toThrow("Only the task owner");
    applyAction(f.doc, f.users, f.active, {
      type: "makeup.review",
      id: "makeup-3",
      status: "approved",
      note: "Verified",
    });
    expect(f.doc.records.makeup.find(x => x.id === "makeup-3").status).toBe(
      "verified"
    );
    expect(() =>
      applyAction(f.doc, f.users, f.active, {
        type: "makeup.review",
        id: "makeup-3",
        status: "approved",
        note: "Test",
      })
    ).toThrow("master must award");
    applyAction(f.doc, f.users, f.master, {
      type: "makeup.review",
      id: "makeup-3",
      status: "approved",
      note: "Credit awarded",
    });
    expect(f.doc.records.makeup.find(x => x.id === "makeup-3").status).toBe(
      "approved"
    );
  });
  it("keeps submissions owned and supports requested revisions and resubmission", () => {
    const f = setup();
    applyAction(f.doc, f.users, f.pledge, {
      type: "deliverable.submit",
      id: "deliverable-1",
      pledgeId: f.other.id,
      url: "https://example.com/work",
      note: "First pass",
    });
    const sub = f.doc.records.submission.at(-1);
    expect(sub.pledgeId).toBe(f.pledge.id);
    applyAction(f.doc, f.users, f.master, {
      type: "deliverable.review",
      id: sub.id,
      status: "changes_requested",
      note: "Add evidence",
    });
    applyAction(f.doc, f.users, f.pledge, {
      type: "deliverable.submit",
      id: "deliverable-1",
      url: "https://example.com/revision",
    });
    expect(f.doc.records.submission).toHaveLength(1);
    applyAction(f.doc, f.users, f.master, {
      type: "deliverable.review",
      id: sub.id,
      status: "approved",
      note: "Approved",
    });
    expect(() =>
      applyAction(f.doc, f.users, f.pledge, {
        type: "deliverable.submit",
        id: "deliverable-1",
        url: "https://example.com/work",
      })
    ).toThrow("already been submitted");
  });
  it("permits all roles to RSVP only for themselves and reserves schedule changes for masters", () => {
    const f = setup();
    for (const actor of [f.master, f.active, f.pledge])
      applyAction(f.doc, f.users, actor, {
        type: "event.rsvp",
        id: "event-1",
        userId: f.other.id,
        status: "unavailable",
      });
    expect(f.doc.records.event.find(e => e.id === "event-1").rsvps).toEqual({
      [f.master.id]: "unavailable",
      [f.active.id]: "unavailable",
      [f.pledge.id]: "unavailable",
    });
    const e = f.doc.records.event.find(e => e.id === "event-1");
    applyAction(f.doc, f.users, f.master, {
      ...e,
      type: "event.update",
      eventType: e.type,
      title: "Updated event",
    });
    expect(f.doc.records.event.find(x => x.id === e.id).title).toBe(
      "Updated event"
    );
  });
  it("limits question replies to masters and the author, and hides private conversations", () => {
    const f = setup();
    applyAction(f.doc, f.users, f.pledge, {
      type: "question.create",
      title: "Private",
      body: "Context",
      private: true,
    });
    const q = f.doc.records.question.at(-1);
    for (const actor of [f.active, f.other]) {
      expect(() =>
        applyAction(f.doc, f.users, actor, {
          type: "question.reply",
          id: q.id,
          body: "Reply",
        })
      ).toThrow("private");
      expect(
        snapshot(f.doc, f.users, actor).questions.some(x => x.id === q.id)
      ).toBe(false);
    }
    applyAction(f.doc, f.users, f.master, {
      type: "question.reply",
      id: q.id,
      body: "Answer",
    });
    applyAction(f.doc, f.users, f.master, {
      type: "question.resolve",
      id: q.id,
    });
    expect(q.resolved).toBe(true);
    applyAction(f.doc, f.users, f.pledge, {
      type: "question.reply",
      id: q.id,
      body: "Follow-up",
    });
    expect(q.resolved).toBe(false);
    expect(() =>
      applyAction(f.doc, f.users, f.other, {
        type: "question.reply",
        id: "question-1",
        body: "Reply",
      })
    ).toThrow("Only pledge masters and the author");
  });
  it("removes archived members from current totals and blocks their actions", () => {
    const f = setup();
    f.pledge.archived = true;
    const s = snapshot(f.doc, f.users, f.master);
    expect(s.coffee.some(c => c.pledgeId === f.pledge.id)).toBe(false);
    expect(s.makeups.some(m => m.pledgeId === f.pledge.id)).toBe(false);
    expect(f.doc.records.coffee.some(c => c.pledgeId === f.pledge.id)).toBe(
      true
    );
    expect(() =>
      applyAction(f.doc, f.users, f.pledge, {
        type: "question.create",
        title: "Test",
        body: "Test",
      })
    ).toThrow("Member access required");
  });
});

it("reporting actives see earned credit without other task owners' private evidence",()=>{
 const {users,doc}=sampleWorkspace(); const reporter=users[3];
 doc.records.strike.find(s=>s.id==="strike-2").reporterId=reporter.id;
 const task=doc.records.makeup.find(t=>t.id==="makeup-3"); task.status="approved";task.evidence="Private completion details";task.reviewNote="Private feedback";
 const visible=snapshot(doc,users,reporter).makeups.find(t=>t.id===task.id)!;
 expect(visible.strikeId).toBe("strike-2");expect(visible.evidence).toBe("");expect(visible.reviewNote).toBe("");
 expect(snapshot(doc,users,users[4]).makeups.find(t=>t.id===task.id)?.strikeId).toBeNull();
});
