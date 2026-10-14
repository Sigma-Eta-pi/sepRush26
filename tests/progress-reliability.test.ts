import { expect, it } from "vitest";
import { progress, strikeBalance } from "../client/src/member-portal/lib";
import { strikeSlots } from "../client/src/member-portal/strike-table";
import { sampleWorkspace } from "../server/process/sample";
import { snapshot } from "../server/process/engine";

function fixture() {
  const { doc, users } = sampleWorkspace();
  const pledge = users[57],
    active = users[2],
    archived = users[3];
  archived.archived = true;
  return {
    state: snapshot(doc, users, users[0]),
    pledge,
    active,
    archived,
    other: users[58],
  };
}

it("counts only distinct completed coffee pairs with current staff", () => {
  const f = fixture();
  const chat = {
    id: "one",
    pledgeId: f.pledge.id,
    activeId: f.active.id,
    status: "complete",
    date: "2026-01-01",
    createdAt: "2026-01-01T00:00:00Z",
    location: "",
    note: "",
  };
  f.state.coffee = [
    chat,
    { ...chat, id: "duplicate" },
    { ...chat, id: "archived", activeId: f.archived.id },
    { ...chat, id: "nonexistent", activeId: "not-a-member" },
    { ...chat, id: "other-pledge", pledgeId: f.other.id },
    { ...chat, id: "pledge-as-active", activeId: f.other.id },
    { ...chat, id: "pending", activeId: f.state.user.id, status: "pending" },
  ];
  expect(progress(f.state, f.pledge).coffee).toBe(1);
  // Defensive against an older response that included archived accounts inline.
  f.state.users.push(f.archived);
  expect(progress(f.state, f.pledge).coffee).toBe(1);
});

it("fallback deliverable progress deduplicates approvals and ignores unrelated or deleted requirements", () => {
  const f = fixture();
  const assignment = f.state.deliverables[0];
  const submission = {
    id: "one",
    pledgeId: f.pledge.id,
    deliverableId: assignment.id,
    status: "approved",
    url: "https://example.com",
    note: "",
    feedback: "",
    submittedAt: "2026-01-01T00:00:00Z",
  };
  f.state.classProgress = [];
  f.state.coffee = [];
  f.state.submissions = [
    submission,
    { ...submission, id: "duplicate" },
    { ...submission, id: "deleted", deliverableId: "deleted" },
    { ...submission, id: "other-pledge", pledgeId: f.other.id },
    {
      ...submission,
      id: "pending",
      deliverableId: f.state.deliverables[1].id,
      status: "submitted",
    },
  ];
  expect(progress(f.state, f.pledge).done).toBe(1);
});

it("uses authorized class summaries when detailed submissions are not visible and caps legacy inflated totals", () => {
  const f = fixture();
  f.state.submissions = [];
  f.state.classProgress = [{ pledgeId: f.pledge.id, approvedDeliverables: 2 }];
  expect(progress(f.state, f.pledge).done).toBe(2);
  f.state.classProgress[0].approvedDeliverables = 500;
  expect(progress(f.state, f.pledge).done).toBe(f.state.deliverables.length);
  expect(progress(f.state, f.pledge).percent).toBeLessThanOrEqual(100);
});

it("does not inflate the progress denominator for a duplicated historical deliverable ID", () => {
  const f = fixture();
  f.state.coffee = [];
  f.state.settings.coffeeGoal = 0;
  f.state.classProgress = [
    {
      pledgeId: f.pledge.id,
      approvedDeliverables: f.state.deliverables.length,
    },
  ];
  f.state.deliverables.push({ ...f.state.deliverables[0] });
  expect(progress(f.state, f.pledge).percent).toBe(100);
});

it("strike totals and table cells ignore approved makeup belonging to another pledge", () => {
  const f = fixture();
  const strike = f.state.strikes.find(s => s.pledgeId === f.pledge.id)!;
  strike.points = 2;
  strike.status = "approved";
  f.state.strikes = [strike];
  const task = {
    id: "wrong-pledge",
    title: "Task",
    description: "",
    ownerId: f.active.id,
    pledgeId: f.other.id,
    strikeId: strike.id,
    credit: 2,
    status: "approved",
    dueAt: "2099-01-01T00:00:00Z",
    evidence: "",
    reviewNote: "",
  };
  f.state.makeups = [
    task,
    {
      ...task,
      id: "owner-confirmed",
      pledgeId: f.pledge.id,
      status: "verified",
    },
  ];
  expect(strikeBalance(f.state, f.pledge.id)).toBe(2);
  expect(
    strikeSlots(f.state.strikes, f.state.makeups, f.pledge.id).map(
      s => s.madeUp
    )
  ).toEqual([false, false]);
  f.state.makeups.push({
    ...task,
    id: "correct",
    pledgeId: f.pledge.id,
    credit: 1,
  });
  expect(strikeBalance(f.state, f.pledge.id)).toBe(1);
  expect(
    strikeSlots(f.state.strikes, f.state.makeups, f.pledge.id).map(
      s => s.madeUp
    )
  ).toEqual([true, false]);
});
