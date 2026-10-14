import { it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createSepMcpServer, type Scope } from "../server/mcp/server";
import { actions } from "../server/mcp/catalog";
import { mcpFixture } from "./mcp-fixture";
async function connect(
  f: ReturnType<typeof mcpFixture>,
  id = f.master.id,
  scopes: Scope[] = ["sep:read", "sep:write"]
) {
  const server = await createSepMcpServer(f.backend, id, scopes),
    client = new Client({ name: "sep-test", version: "1" }),
    [c, s] = InMemoryTransport.createLinkedPair();
  await server.connect(s);
  await client.connect(c);
  return {
    client,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}
const payload = (r: any) => JSON.parse(r.content[0].text);
it("discovers every supported process action and complete paginated roster and member context", async () => {
  const f = mcpFixture(),
    c = await connect(f);
  try {
    const listed = (await c.client.listTools()).tools.map(t => t.name);
    for (const a of actions.filter(a => a.roles.includes("master")))
      expect(listed).toContain(`sep_${a.name}`);
    const ctx = payload(
      await c.client.callTool({ name: "sep_get_context", arguments: {} })
    );
    expect(ctx.counts.users).toBe(70);
    expect(ctx.demo).toBe(true);
    expect(ctx.unavailable).toContain("chapterUpdates");
    const a = payload(
        await c.client.callTool({
          name: "sep_list_records",
          arguments: { section: "users", limit: 50 },
        })
      ),
      b = payload(
        await c.client.callTool({
          name: "sep_list_records",
          arguments: { section: "users", offset: a.nextOffset },
        })
      );
    expect([...a.items, ...b.items]).toHaveLength(70);
    expect(b.nextOffset).toBeNull();
    const member = payload(
      await c.client.callTool({
        name: "sep_get_member_context",
        arguments: { memberId: f.pledge.id },
      })
    );
    expect(member.member.id).toBe(f.pledge.id);
    expect(member.progress.coffee.required).toBe(35);
    expect(member.records.items.some((r: any) => r.section === "strikes")).toBe(
      true
    );
    const docs = payload(
      await c.client.callTool({
        name: "sep_search",
        arguments: { query: "handbook" },
      })
    );
    expect(docs.items[0].section).toBe("documents");
  } finally {
    await c.close();
  }
});
it("does not leak private records to another pledge or expose staff write tools", async () => {
  const f = mcpFixture();
  await f.backend.action(
    f.pledge.id,
    {
      type: "question.create",
      title: "Private unique issue",
      body: "private-secret",
      private: true,
    },
    randomUUID()
  );
  const c = await connect(f, f.other.id);
  try {
    expect(
      (await c.client.listTools()).tools.some(
        t => t.name === "sep_report_strike"
      )
    ).toBe(false);
    const search = payload(
      await c.client.callTool({
        name: "sep_search",
        arguments: { query: "private-secret" },
      })
    );
    expect(search.total).toBe(0);
    const strikes = payload(
      await c.client.callTool({
        name: "sep_list_records",
        arguments: { section: "strikes" },
      })
    );
    expect(strikes.items.every((x: any) => x.pledgeId === f.other.id)).toBe(
      true
    );
    const edited = await c.client.callTool({
      name: "sep_edit_profile",
      arguments: { memberId: f.pledge.id, changes: { phone: "000" } },
    });
    expect(edited.isError).toBe(true);
  } finally {
    await c.close();
  }
});
it("respects read-only scopes and current role revocation after tool discovery", async () => {
  const f = mcpFixture(),
    read = await connect(f, f.master.id, ["sep:read"]);
  expect(
    (await read.client.listTools()).tools.every(
      t => t.annotations?.readOnlyHint
    )
  ).toBe(true);
  await read.close();
  const c = await connect(f);
  f.master.role = "active";
  const result = await c.client.callTool({
    name: "sep_create_event",
    arguments: {
      requestId: randomUUID(),
      title: "Example",
      startsAt: "2026-11-01T17:00:00Z",
      endsAt: "2026-11-01T18:00:00Z",
      location: "Campus",
      description: "Meeting",
      eventType: "chapter",
    },
  });
  expect(result.isError).toBe(true);
  f.master.archived = true;
  expect(
    (await c.client.callTool({ name: "sep_get_context", arguments: {} }))
      .isError
  ).toBe(true);
  await c.close();
});
it("commits concurrent retries once, rejects changed request payloads and immediately exposes updates", async () => {
  const f = mcpFixture(),
    c = await connect(f),
    requestId = randomUUID();
  const args = {
    requestId,
    pledgeId: f.pledge.id,
    reason: "Integration test",
    points: 1,
    date: "2026-01-01",
  };
  const before = f.doc.records.strike.length;
  const results = await Promise.all(
    [1, 2].map(() =>
      c.client.callTool({ name: "sep_report_strike", arguments: args })
    )
  );
  expect(results.every(r => !r.isError)).toBe(true);
  expect(f.doc.records.strike).toHaveLength(before + 1);
  expect(f.doc.audit[0].source).toBe("mcp");
  expect(
    (
      await c.client.callTool({
        name: "sep_report_strike",
        arguments: { ...args, points: 2 },
      })
    ).isError
  ).toBe(true);
  const updated = payload(
    await c.client.callTool({
      name: "sep_search",
      arguments: { query: "Integration test" },
    })
  );
  expect(updated.items.some((r: any) => r.section === "strikes")).toBe(true);
  await c.close();
});
it("edits permitted profiles and preserves archived histories", async () => {
  const f = mcpFixture(),
    c = await connect(f);
  const changed = payload(
    await c.client.callTool({
      name: "sep_edit_profile",
      arguments: {
        memberId: f.pledge.id,
        changes: { pledgeClass: "Beta", profileTags: ["Design"] },
      },
    })
  );
  expect(changed.member.pledgeClass).toBe("Beta");
  expect(
    (
      await c.client.callTool({
        name: "sep_edit_profile",
        arguments: { memberId: f.pledge.id, changes: { role: "master" } },
      })
    ).isError
  ).toBe(true);
  await c.client.callTool({
    name: "sep_set_pledge_archived",
    arguments: { memberId: f.pledge.id, archived: true },
  });
  const context = payload(
    await c.client.callTool({
      name: "sep_get_member_context",
      arguments: { memberId: f.pledge.id },
    })
  );
  expect(context.member.archived).toBe(true);
  expect(context.records.items.some((r: any) => r.section === "strikes")).toBe(
    true
  );
  await c.close();
});

it("excludes chapter tools from pledge context, lists and search, including after role changes", async () => {
  const f = mcpFixture(),
    c = await connect(f, f.active.id);
  try {
    expect((await f.backend.extra(f.active.id)).records.documents).toHaveLength(
      1
    );
    f.active.role = "pledge";
    const ctx = payload(
      await c.client.callTool({ name: "sep_get_context", arguments: {} })
    );
    expect(ctx.unavailable).toContain("documents");
    const search = payload(
      await c.client.callTool({
        name: "sep_search",
        arguments: { query: "handbook" },
      })
    );
    expect(search.total).toBe(0);
    const docs = payload(
      await c.client.callTool({
        name: "sep_list_records",
        arguments: { section: "documents" },
      })
    );
    expect(docs.items).toEqual([]);
    expect((await f.backend.extra(f.pledge.id)).records).toEqual({});
  } finally {
    await c.close();
  }
});

it("assigns and later credits an unlinked makeup through the actual MCP tools", async () => {
  const f = mcpFixture(),
    c = await connect(f);
  try {
    const created = await c.client.callTool({
      name: "sep_create_makeup",
      arguments: {
        requestId: randomUUID(),
        title: "Prepare workshop handouts",
        description: "Organize the printed handouts",
        dueAt: new Date(Date.now() + 86400000).toISOString(),
        credit: 1,
        pledgeId: f.pledge.id,
      },
    });
    expect(created.isError).not.toBe(true);
    let task = (await f.backend.state(f.master.id)).makeups.find(
      t => t.title === "Prepare workshop handouts"
    )!;
    expect(task).toMatchObject({
      status: "claimed",
      pledgeId: f.pledge.id,
      strikeId: null,
    });
    await f.backend.action(
      f.pledge.id,
      { type: "makeup.submit", id: task.id, evidence: "Handouts ready" },
      randomUUID()
    );
    const reviewed = await c.client.callTool({
      name: "sep_review_makeup_work",
      arguments: {
        requestId: randomUUID(),
        id: task.id,
        status: "approved",
        note: "Work approved; apply credit later",
      },
    });
    expect(reviewed.isError).not.toBe(true);
    task = (await f.backend.state(f.master.id)).makeups.find(
      t => t.id === task.id
    )!;
    expect(task).toMatchObject({ status: "completed", strikeId: null });
    await f.backend.action(
      f.master.id,
      {
        type: "strike.report",
        pledgeId: f.pledge.id,
        date: "2026-10-12",
        points: 1,
        reason: "Fixture incident for deferred credit",
      },
      randomUUID()
    );
    const strike = (await f.backend.state(f.master.id)).strikes.find(
      s => s.reason === "Fixture incident for deferred credit"
    )!;
    const credited = await c.client.callTool({
      name: "sep_review_makeup_work",
      arguments: {
        requestId: randomUUID(),
        id: task.id,
        status: "approved",
        strikeId: strike.id,
        note: "Apply the completed work",
      },
    });
    expect(credited.isError).not.toBe(true);
    expect(
      (await f.backend.state(f.master.id)).makeups.find(t => t.id === task.id)
    ).toMatchObject({ status: "approved", strikeId: strike.id });
  } finally {
    await c.close();
  }
});
