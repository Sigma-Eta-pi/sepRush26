import { expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createSepMcpServer } from "../server/mcp/server";
import { mcpFixture } from "./mcp-fixture";

it("MCP progress counts current unique requirements while keeping full historical records readable", async () => {
  const f = mcpFixture();
  const retired = f.users[3];
  retired.archived = true;
  const completed = {
    id: "c1",
    pledgeId: f.pledge.id,
    activeId: f.active.id,
    status: "complete",
  };
  f.doc.records.coffee = [
    completed,
    { ...completed, id: "duplicate" },
    { ...completed, id: "stale-pending", status: "pending" },
    {
      ...completed,
      id: "retired-pending",
      activeId: retired.id,
      status: "pending",
    },
  ];
  const submitted = {
    id: "s1",
    pledgeId: f.pledge.id,
    deliverableId: "deliverable-1",
    status: "approved",
  };
  f.doc.records.submission = [
    submitted,
    { ...submitted, id: "duplicate" },
    { ...submitted, id: "orphan", deliverableId: "deleted" },
  ];
  const server = await createSepMcpServer(f.backend, f.master.id, [
    "sep:read",
    "sep:write",
  ]);
  const client = new Client({ name: "reliability-test", version: "1" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const result: any = await client.callTool({
      name: "sep_get_member_context",
      arguments: { memberId: f.pledge.id },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.progress.coffee).toMatchObject({
      required: 35,
      remaining: 34,
      complete: 1,
      pending: 0,
    });
    expect(data.progress.coffee.missingActiveIds).toHaveLength(53);
    expect(data.progress.deliverables.approved).toBe(1);
    expect(
      data.records.items.filter((r: any) => r.section === "coffee")
    ).toHaveLength(4);
    expect(
      (await f.backend.state(f.master.id)).classProgress.find(
        p => p.pledgeId === f.pledge.id
      )?.approvedDeliverables
    ).toBe(1);
  } finally {
    await client.close();
    await server.close();
  }
});

it("MCP rejects timezone-free event dates before any write and accepts explicit DST offsets", async () => {
  const f = mcpFixture();
  const server = await createSepMcpServer(f.backend, f.master.id, [
    "sep:read",
    "sep:write",
  ]);
  const client = new Client({ name: "reliability-test", version: "1" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  const body = {
    requestId: randomUUID(),
    title: "Meeting",
    startsAt: "2026-11-01T01:30",
    endsAt: "2026-11-01T02:30",
    location: "Campus",
    description: "Meet",
    eventType: "chapter",
  };
  try {
    const count = f.doc.records.event.length;
    const rejected = await client.callTool({
      name: "sep_create_event",
      arguments: body,
    });
    expect(rejected.isError).toBe(true);
    expect(f.doc.records.event).toHaveLength(count);
    const accepted = await client.callTool({
      name: "sep_create_event",
      arguments: {
        ...body,
        startsAt: "2026-11-01T01:30:00-07:00",
        endsAt: "2026-11-01T01:30:00-08:00",
      },
    });
    expect(accepted.isError).not.toBe(true);
    expect(f.doc.records.event).toHaveLength(count + 1);
    const event = f.doc.records.event.at(-1);
    expect(Date.parse(event.endsAt) - Date.parse(event.startsAt)).toBe(3600000);
  } finally {
    await client.close();
    await server.close();
  }
});
