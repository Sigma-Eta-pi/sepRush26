import { it, expect } from "vitest";
import { applyAction, snapshot } from "../server/process/engine";
import { sampleWorkspace } from "../server/process/sample";

function setup() {
  const { users, doc } = sampleWorkspace();
  doc.records.makeup = [];
  const master = users[0],
    pledge = users[57],
    active = users[2];
  const strike = doc.records.strike.find(s => s.pledgeId === pledge.id)!;
  strike.status = "approved";
  strike.points = 1;
  const task = {
    type: "makeup.offer",
    title: "Prepare meeting materials",
    description: "Print and organize the handouts",
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    credit: 1,
  };
  return { users, doc, master, pledge, active, strike, task };
}

it("creates an assigned makeup and grants credit only after completion and approval", () => {
  const f = setup();
  applyAction(f.doc, f.users, f.master, { ...f.task, strikeId: f.strike.id });
  const task = f.doc.records.makeup[0];
  expect(task).toMatchObject({
    status: "claimed",
    pledgeId: f.pledge.id,
    strikeId: f.strike.id,
  });
  expect(snapshot(f.doc, f.users, f.pledge).makeups[0]).toMatchObject({
    id: task.id,
    status: "claimed",
  });
  applyAction(f.doc, f.users, f.pledge, {
    type: "makeup.submit",
    id: task.id,
    evidence: "Handouts prepared",
  });
  applyAction(f.doc, f.users, f.master, {
    type: "makeup.review",
    id: task.id,
    status: "approved",
    note: "Work checked",
  });
  expect(f.doc.records.makeup[0].status).toBe("approved");
});

it("assigns an available task once and reserves the strike credit", () => {
  const f = setup();
  applyAction(f.doc, f.users, f.active, f.task);
  const task = f.doc.records.makeup[0];
  applyAction(f.doc, f.users, f.master, {
    type: "makeup.approveOffer",
    id: task.id,
    status: "open",
  });
  applyAction(f.doc, f.users, f.master, {
    type: "makeup.assign",
    id: task.id,
    strikeId: f.strike.id,
  });
  expect(task.ownerId).toBe(f.active.id);
  expect(() =>
    applyAction(f.doc, f.users, f.master, {
      type: "makeup.assign",
      id: task.id,
      strikeId: f.strike.id,
    })
  ).toThrow("Only available");
  const before = structuredClone(f.doc);
  expect(() =>
    applyAction(f.doc, f.users, f.master, { ...f.task, strikeId: f.strike.id })
  ).toThrow("enough makeup");
  expect(f.doc).toEqual(before);
});

it("rejects active assignments, removed pledges, unapproved strikes and expired tasks without changes", () => {
  const f = setup();
  const before = structuredClone(f.doc);
  expect(() =>
    applyAction(f.doc, f.users, f.active, { ...f.task, strikeId: f.strike.id })
  ).toThrow("Only pledge masters");
  f.pledge.archived = true;
  expect(() =>
    applyAction(f.doc, f.users, f.master, { ...f.task, strikeId: f.strike.id })
  ).toThrow("valid member");
  f.pledge.archived = false;
  expect(() =>
    applyAction(f.doc, f.users, f.master, {
      ...f.task,
      dueAt: "2000-01-01T00:00:00Z",
      strikeId: f.strike.id,
    })
  ).toThrow("deadline has passed");
  expect(f.doc).toEqual(before);
  f.strike.status = "reported";
  expect(() =>
    applyAction(f.doc, f.users, f.master, { ...f.task, strikeId: f.strike.id })
  ).toThrow("approved strike");
});

it("assigns before any strike, saves approved work without credit, then credits a later approved strike once", () => {
  const f = setup();
  f.doc.records.strike = [];
  applyAction(f.doc, f.users, f.master, { ...f.task, pledgeId: f.pledge.id });
  const task = f.doc.records.makeup[0];
  expect(task).toMatchObject({
    pledgeId: f.pledge.id,
    strikeId: null,
    status: "claimed",
  });
  expect(snapshot(f.doc, f.users, f.pledge).makeups).toContainEqual(task);
  applyAction(f.doc, f.users, f.pledge, {
    type: "makeup.submit",
    id: task.id,
    evidence: "Prepared the materials",
  });
  applyAction(f.doc, f.users, f.master, {
    type: "makeup.review",
    id: task.id,
    status: "approved",
    note: "Work verified",
  });
  expect(task).toMatchObject({ status: "completed", strikeId: null });
  f.doc.records.strike = [f.strike];
  applyAction(f.doc, f.users, f.master, {
    type: "makeup.review",
    id: task.id,
    status: "approved",
    strikeId: f.strike.id,
    note: "Apply verified work",
  });
  expect(task).toMatchObject({ status: "approved", strikeId: f.strike.id });
  expect(() =>
    applyAction(f.doc, f.users, f.master, {
      type: "makeup.review",
      id: task.id,
      status: "approved",
      strikeId: f.strike.id,
      note: "Again",
    })
  ).toThrow("not awaiting review");
});

it("allows an owner to verify unlinked work but only a master can approve it or apply credit", () => {
  const f = setup();
  applyAction(f.doc, f.users, f.active, f.task);
  const task = f.doc.records.makeup[0];
  applyAction(f.doc, f.users, f.master, {
    type: "makeup.approveOffer",
    id: task.id,
    status: "open",
  });
  applyAction(f.doc, f.users, f.master, {
    type: "makeup.assign",
    id: task.id,
    pledgeId: f.pledge.id,
  });
  applyAction(f.doc, f.users, f.pledge, {
    type: "makeup.submit",
    id: task.id,
    evidence: "Done",
  });
  const before = structuredClone(f.doc);
  expect(() =>
    applyAction(f.doc, f.users, f.active, {
      type: "makeup.review",
      id: task.id,
      status: "approved",
      strikeId: f.strike.id,
      note: "Done",
    })
  ).toThrow("Only pledge masters");
  expect(f.doc).toEqual(before);
  applyAction(f.doc, f.users, f.active, {
    type: "makeup.review",
    id: task.id,
    status: "approved",
    note: "Checked",
  });
  expect(task.status).toBe("verified");
  expect(() =>
    applyAction(f.doc, f.users, f.active, {
      type: "makeup.review",
      id: task.id,
      status: "approved",
      note: "Checked again",
    })
  ).toThrow("pledge master");
  applyAction(f.doc, f.users, f.master, {
    type: "makeup.review",
    id: task.id,
    status: "approved",
    strikeId: f.strike.id,
    note: "Credit awarded",
  });
  expect(task.status).toBe("approved");
});

it("rejects invalid unlinked assignments and invalid later credit without mutating records", () => {
  const f = setup();
  for (const [actor, pledgeId] of [
    [f.active, f.pledge.id],
    [f.master, f.active.id],
  ] as const) {
    const before = structuredClone(f.doc);
    expect(() =>
      applyAction(f.doc, f.users, actor, { ...f.task, pledgeId })
    ).toThrow();
    expect(f.doc).toEqual(before);
  }
  f.pledge.archived = true;
  expect(() =>
    applyAction(f.doc, f.users, f.master, { ...f.task, pledgeId: f.pledge.id })
  ).toThrow("valid member");
  f.pledge.archived = false;
  applyAction(f.doc, f.users, f.master, { ...f.task, pledgeId: f.pledge.id });
  const task = f.doc.records.makeup[0];
  applyAction(f.doc, f.users, f.pledge, {
    type: "makeup.submit",
    id: task.id,
    evidence: "Done",
  });
  const review = {
    type: "makeup.review",
    id: task.id,
    status: "approved",
    strikeId: f.strike.id,
    note: "Checked",
  };
  for (const patch of [{ status: "reported" }, { pledgeId: f.users[58].id }]) {
    const strikeBefore = structuredClone(f.strike);
    Object.assign(f.strike, patch);
    const before = structuredClone(f.doc);
    expect(() => applyAction(f.doc, f.users, f.master, review)).toThrow(
      "approved strike"
    );
    expect(f.doc).toEqual(before);
    Object.assign(f.strike, strikeBefore);
  }
  const before = structuredClone(f.doc);
  expect(() =>
    applyAction(f.doc, f.users, f.master, { ...review, note: "" })
  ).toThrow("Feedback");
  expect(f.doc).toEqual(before);
  applyAction(f.doc, f.users, f.master, { ...f.task, strikeId: f.strike.id });
  const reserved = structuredClone(f.doc);
  expect(() => applyAction(f.doc, f.users, f.master, review)).toThrow(
    "enough makeup"
  );
  expect(f.doc).toEqual(reserved);
});
