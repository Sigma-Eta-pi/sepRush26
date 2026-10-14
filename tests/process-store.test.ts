import { it, expect } from "vitest";
import { mutateProcess } from "../server/process/store";
import { sampleWorkspace } from "../server/process/sample";
it("concurrent logs for a pair commit once and retain the audit entry", async () => {
  const { users, doc } = sampleWorkspace();
  let data = doc,
    version = 0;
  const store = {
    read: async () => ({ version, data: structuredClone(data) }),
    compareAndSwap: async (v: string | number, d: typeof doc) => {
      if (v !== version) return false;
      version++;
      data = d;
      return true;
    },
  };
  const body = {
    type: "coffee.log",
    activeId: users[50].id,
    date: "2026-01-01",
    note: "Thank you for meeting with me.",
  };
  const results = await Promise.allSettled([
    mutateProcess(store, users, users[55], body),
    mutateProcess(store, users, users[55], body),
  ]);
  expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
  expect(
    data.records.coffee.filter(
      c => c.pledgeId === users[55].id && c.activeId === users[50].id
    )
  ).toHaveLength(1);
  expect(data.audit).toHaveLength(1);
});
it("returns conflict without claiming a save when storage stays contested", async () => {
  const { users, doc } = sampleWorkspace();
  const store = {
    read: async () => ({ version: 0, data: doc }),
    compareAndSwap: async () => false,
  };
  await expect(
    mutateProcess(store, users, users[0], {
      type: "question.create",
      title: "Hello",
      body: "Question",
    })
  ).rejects.toMatchObject({ status: 409 });
  expect(doc.records.question).toHaveLength(1);
});
