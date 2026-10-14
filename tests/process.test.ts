import { describe, it, expect } from "vitest";
import { applyAction, snapshot } from "../server/process/engine";
import { sampleWorkspace } from "../server/process/sample";
const fixture = () => {
  const { users, doc } = sampleWorkspace();
  return {
    users,
    doc,
    master: users[0],
    active: users[2],
    pledge: users[57],
    other: users[58],
  };
};
describe("Pledge process authorization and workflows", () => {
  it("scales to 55 actives and 15 pledges, each meeting a set number of actives", () => {
    const { doc, users, master } = fixture();
    const s = snapshot(doc, users, master);
    expect(s.users).toHaveLength(70);
    expect(s.settings.coffeeGoal).toBe(35);
    applyAction(doc, users, master, {
      type: "settings.update",
      ...s.settings,
      coffeeGoal: 40,
    });
    expect(snapshot(doc, users, master).settings.coffeeGoal).toBe(40);
    // Never more chats than there are actives to meet.
    doc.settings.coffeeTarget = 90;
    expect(snapshot(doc, users, master).settings.coffeeGoal).toBe(55);
    expect(s.classProgress).toHaveLength(15);
  });
  it("keeps private questions, submissions, strike records and audit out of other pledge views", () => {
    const { doc, users, master, pledge, other } = fixture();
    applyAction(doc, users, pledge, {
      type: "question.create",
      title: "Private concern",
      body: "Please help privately.",
      private: true,
    });
    applyAction(doc, users, pledge, {
      type: "deliverable.submit",
      id: "deliverable-1",
      url: "https://example.com/assignment",
    });
    const s = snapshot(doc, users, other);
    expect(s.questions.some(q => q.private)).toBe(false);
    expect(s.submissions).toEqual([]);
    expect(s.strikes.every(x => x.pledgeId === other.id)).toBe(true);
    expect(s.audit).toEqual([]);
    expect(snapshot(doc, users, master).questions.some(q => q.private)).toBe(
      true
    );
  });
  it("requires a master to approve strikes", () => {
    const { doc, users, active, master } = fixture();
    expect(() =>
      applyAction(doc, users, active, {
        type: "strike.review",
        id: "strike-0",
        status: "approved",
        note: "Reviewed",
      })
    ).toThrow("Only pledge masters");
    applyAction(doc, users, master, {
      type: "strike.review",
      id: "strike-0",
      status: "approved",
      note: "Reviewed",
    });
    expect(doc.records.strike.find(s => s.id === "strike-0").status).toBe(
      "approved"
    );
  });
  it("allows one claim, owner verification, then master credit", () => {
    const { doc, users, pledge, active, master, other } = fixture();
    doc.records.makeup = doc.records.makeup.filter(x => x.id !== "makeup-3");
    applyAction(doc, users, pledge, {
      type: "makeup.claim",
      id: "makeup-1",
      strikeId: "strike-2",
    });
    expect(() =>
      applyAction(doc, users, other, {
        type: "makeup.claim",
        id: "makeup-1",
        strikeId: "strike-3",
      })
    ).toThrow("already been claimed");
    applyAction(doc, users, pledge, {
      type: "makeup.submit",
      id: "makeup-1",
      evidence: "Finished materials",
    });
    applyAction(doc, users, active, {
      type: "makeup.review",
      id: "makeup-1",
      status: "approved",
      note: "Checked",
    });
    expect(doc.records.makeup.find(x => x.id === "makeup-1").status).toBe(
      "verified"
    );
    applyAction(doc, users, master, {
      type: "makeup.review",
      id: "makeup-1",
      status: "approved",
      note: "Credit awarded",
    });
    expect(doc.records.makeup.find(x => x.id === "makeup-1").status).toBe(
      "approved"
    );
  });
  it("prevents extra makeup credit being claimed for the same strike", () => {
    const { doc, users, pledge } = fixture();
    expect(() =>
      applyAction(doc, users, pledge, {
        type: "makeup.claim",
        id: "makeup-1",
        strikeId: "strike-2",
      })
    ).toThrow("enough makeup");
  });
  it("lets only pledges log chats, with a thank-you, for that active alone to confirm or reject", () => {
    const { doc, users, pledge, other, master } = fixture();
    const active = users[50];
    const body = {
      type: "coffee.log",
      pledgeId: pledge.id,
      activeId: active.id,
      date: new Date(Date.now() - 86400000).toISOString(),
      note: "Thank you for the advice on recruiting.",
    };
    for (const staff of [active, master])
      expect(() => applyAction(doc, users, staff, body)).toThrow(
        "Only pledges"
      );
    expect(() => applyAction(doc, users, pledge, { ...body, note: " " })).toThrow(
      "thank-you message"
    );
    applyAction(doc, users, pledge, body);
    const c = doc.records.coffee.at(-1);
    expect(c.status).toBe("pending");
    expect(() =>
      applyAction(doc, users, pledge, {
        type: "coffee.update",
        id: c.id,
        status: "complete",
      })
    ).toThrow("Only this active");
    expect(() =>
      applyAction(doc, users, users[49], {
        type: "coffee.update",
        id: c.id,
        status: "complete",
      })
    ).toThrow("Only this active");
    // Pledge masters do not confirm on an active's behalf.
    expect(() =>
      applyAction(doc, users, master, {
        type: "coffee.update",
        id: c.id,
        status: "complete",
      })
    ).toThrow("Only this active");
    expect(snapshot(doc, users, users[49]).coffee.find(x => x.id === c.id)?.note).toBe("");
    expect(snapshot(doc, users, active).coffee.find(x => x.id === c.id)?.note).toBe(body.note);
    expect(() => applyAction(doc, users, pledge, body)).toThrow(
      "already been recorded"
    );
    applyAction(doc, users, active, {
      type: "coffee.update",
      id: c.id,
      status: "complete",
    });
    expect(c.status).toBe("complete");
    // A rejected chat stops counting and can be logged again.
    const again = { ...body, activeId: users[48].id };
    applyAction(doc, users, pledge, again);
    const rejected = doc.records.coffee.at(-1);
    applyAction(doc, users, users[48], {
      type: "coffee.update",
      id: rejected.id,
      status: "declined",
      note: "We haven't met yet.",
    });
    expect(rejected.status).toBe("declined");
    expect(rejected.reviewNote).toBe("We haven't met yet.");
    applyAction(doc, users, pledge, again);
    expect(doc.records.coffee.at(-1).status).toBe("pending");
    expect(
      snapshot(doc, users, other).coffee.every(x => x.pledgeId === other.id)
    ).toBe(true);
  });
  it("rejects future coffee dates and invalid event dates", () => {
    const { doc, users, pledge, master } = fixture();
    expect(() =>
      applyAction(doc, users, pledge, {
        type: "coffee.log",
        activeId: users[51].id,
        date: "2099-10-01",
      })
    ).toThrow("after you meet");
    expect(() =>
      applyAction(doc, users, master, {
        type: "event.create",
        startsAt: "tomorrow",
        endsAt: "bad",
      })
    ).toThrow("valid date");
  });
  it("does not allow a pledge to impersonate another pledge", () => {
    const { doc, users, pledge, other } = fixture();
    applyAction(doc, users, pledge, {
      type: "coffee.log",
      pledgeId: other.id,
      activeId: users[51].id,
      date: "2026-01-01",
      note: "Thanks for the chat.",
    });
    expect(doc.records.coffee.at(-1).pledgeId).toBe(pledge.id);
  });
  it("restricts schedule changes, deliverable reviews, and private replies", () => {
    const { doc, users, pledge, other } = fixture();
    expect(() =>
      applyAction(doc, users, pledge, { type: "event.update", id: "event-1" })
    ).toThrow("Only pledge masters");
    expect(() =>
      applyAction(doc, users, pledge, {
        type: "deliverable.review",
        id: "none",
      })
    ).toThrow("Only pledge masters");
    applyAction(doc, users, pledge, {
      type: "question.create",
      title: "Private",
      body: "Question",
      private: true,
    });
    expect(() =>
      applyAction(doc, users, other, {
        type: "question.reply",
        id: doc.records.question.at(-1).id,
        body: "Reply",
      })
    ).toThrow("private");
  });
});

it("issues master strikes immediately but queues active reports", () => {
  const { doc, users, master, active, pledge } = fixture();
  const body = {
    type: "strike.report",
    pledgeId: pledge.id,
    reason: "Test meeting",
    date: "2026-10-01",
    points: 2,
  };
  applyAction(doc, users, master, body);
  expect(doc.records.strike.at(-1).status).toBe("approved");
  expect(doc.records.strike.at(-1).reporterId).toBe(master.id);
  applyAction(doc, users, active, body);
  expect(doc.records.strike.at(-1).status).toBe("reported");
});
it("removes archived pledges from class progress without deleting history", () => {
  const { doc, users, master, active, pledge } = fixture();
  pledge.archived = true;
  const state = snapshot(doc, users, master);
  expect(state.users.some(u => u.id === pledge.id)).toBe(false);
  expect(state.classProgress).toHaveLength(14);
  expect(state.archivedUsers).toContain(pledge);
  expect(snapshot(doc, users, active).archivedUsers).toBeUndefined();
  expect(state.strikes.some(s => s.pledgeId === pledge.id)).toBe(true);
  expect(() =>
    applyAction(doc, users, master, {
      type: "strike.report",
      pledgeId: pledge.id,
      reason: "Test",
      date: "2026-10-01",
      points: 1,
    })
  ).toThrow("valid member");
});
