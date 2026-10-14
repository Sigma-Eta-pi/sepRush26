import { it, expect } from "vitest";
import { chapterDemo } from "../server/process/chapter-demo";
import { snapshot } from "../server/process/engine";
import type { User } from "../client/src/member-portal/types";
it("connects the imported chapter to every demo section as Piam without fake identities", () => {
  const imported: User[] = Array.from({ length: 18 }, (_, i) => ({
    id: `import-${i}`,
    name: `Alpha Member ${i}`,
    role: "active",
    major: "Economics",
    year: "2028",
    color: "blue",
    phone: `555-${i}`,
    coverUrl: `https://example.com/cover-${i}.jpg`,
    profileSections: [{ title: "Hobbies", body: "Drawing" }],
  }));
  const { users, doc, demoRoster } = chapterDemo(imported);
  expect(demoRoster).toBe("chapter");
  expect(users).toHaveLength(57);
  expect(users[0].name).toMatch(/^Piam /);
  expect(users[0].role).toBe("master");
  const pledges = users.filter(u => u.role === "pledge");
  expect(pledges).toHaveLength(18);
  expect(pledges[0].profileSections?.[0].body).toBe("Drawing");
  const ids = new Set(users.map(u => u.id));
  for (const rows of Object.values(doc.records))
    for (const row of rows) {
      for (const field of [
        "pledgeId",
        "activeId",
        "ownerId",
        "authorId",
        "reporterId",
      ])
        if (row[field])
          expect(ids.has(row[field]), `${row.id}.${field}`).toBe(true);
      for (const reply of row.replies || [])
        expect(ids.has(reply.authorId)).toBe(true);
      if (row.strikeId)
        expect(
          doc.records.strike.some(
            s => s.id === row.strikeId && s.pledgeId === row.pledgeId
          )
        ).toBe(true);
      if (row.deliverableId)
        expect(
          doc.records.deliverable.some(d => d.id === row.deliverableId)
        ).toBe(true);
    }
  const state = snapshot(doc, users, users[0], true);
  expect(state.settings.coffeeGoal).toBe(35);
  expect(state.classProgress).toHaveLength(18);
  for (const field of [
    "events",
    "coffee",
    "strikes",
    "makeups",
    "deliverables",
    "submissions",
    "questions",
    "audit",
  ] as const)
    expect(state[field].length).toBeGreaterThan(0);
  expect(new Set(state.makeups.map(m => m.status)).size).toBe(6);
  expect(state.questions.some(q => q.private)).toBe(true);
});
