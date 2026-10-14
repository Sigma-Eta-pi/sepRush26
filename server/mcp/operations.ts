import { createHash } from "node:crypto";
import { applyAction, fail, type ProcessDocument } from "../process/engine.js";
import type { User } from "../../client/src/member-portal/types.js";
import type { ProcessStore } from "../process/store.js";
export function fingerprint(value: unknown): string {
  const stable = (v: any): any =>
    Array.isArray(v)
      ? v.map(stable)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .map(k => [k, stable(v[k])])
          )
        : v;
  return createHash("sha256")
    .update(JSON.stringify(stable(value)))
    .digest("hex");
}
export async function mutateFromMcp(
  store: ProcessStore,
  loadUsers: () => Promise<User[]>,
  actorId: string,
  body: Record<string, unknown>,
  requestId: string
) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const users = await loadUsers(),
      actor = users.find(u => u.id === actorId && !u.archived);
    if (!actor) fail("Member access required.", 403);
    const row = await store.read();
    const doc = structuredClone(row.data) as ProcessDocument & {
      mcpRequests?: Record<string, any>;
    };
    const key = fingerprint([actorId, requestId]),
      hash = fingerprint(body);
    const prior = doc.mcpRequests?.[key];
    if (prior) {
      if (prior.hash !== hash)
        fail("This requestId was already used for a different change.", 409);
      return { ...prior.result, replayed: true };
    }
    applyAction(doc, users, actor, body);
    const result = {
      ok: true,
      requestId,
      action: body.type,
      audit: doc.audit[0],
    };
    doc.audit[0].source = "mcp";
    // Receipts are kept with the mutation, so concurrent retries cannot issue duplicate strikes.
    doc.mcpRequests = { ...doc.mcpRequests, [key]: { hash, result } };
    if (await store.compareAndSwap(row.version, doc))
      return { ...result, replayed: false };
  }
  fail(
    "Another member changed this record. Read it again and retry with the same requestId.",
    409
  );
}
