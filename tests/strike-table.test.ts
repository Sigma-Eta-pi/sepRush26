import { it, expect } from "vitest";
import { strikeSlots } from "../client/src/member-portal/strike-table";
import { sampleWorkspace } from "../server/process/sample";

it("represents every issued point separately and only marks approved makeup credit", () => {
  const { doc, users } = sampleWorkspace();
  const pledge = users[57];
  const strike = doc.records.strike.find(s => s.pledgeId === pledge.id);
  strike.points = 3;
  const makeup = doc.records.makeup.find(m => m.strikeId === strike.id);
  makeup.credit = 1;
  makeup.status = "verified";
  expect(
    strikeSlots(doc.records.strike, doc.records.makeup, pledge.id).map(
      s => s.madeUp
    )
  ).toEqual([false, false, false]);
  makeup.status = "approved";
  const slots = strikeSlots(doc.records.strike, doc.records.makeup, pledge.id);
  expect(slots.map(s => s.madeUp)).toEqual([true, false, false]);
  expect(slots.map(s => s.point)).toEqual([1, 2, 3]);
  expect(slots.every(s => s.strike.id === strike.id)).toBe(true);
  makeup.credit = 7;
  expect(
    strikeSlots(doc.records.strike, doc.records.makeup, pledge.id)
  ).toHaveLength(3);
});
it("keeps pending and dismissed records out of the point axis and separates pledges", () => {
  const { doc, users } = sampleWorkspace();
  expect(
    strikeSlots(doc.records.strike, doc.records.makeup, users[55].id)
  ).toEqual([]);
  const strike = doc.records.strike.find(s => s.pledgeId === users[57].id);
  strike.status = "dismissed";
  expect(
    strikeSlots(doc.records.strike, doc.records.makeup, users[57].id)
  ).toEqual([]);
  expect(
    strikeSlots(doc.records.strike, doc.records.makeup, users[58].id)
  ).toHaveLength(1);
});
