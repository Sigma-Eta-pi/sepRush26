import { applyAction, fail, type ProcessDocument } from "./engine.js";
import type { User } from "../../client/src/member-portal/types.js";
export interface ProcessStore {
  read(): Promise<{ version: string | number; data: ProcessDocument }>;
  compareAndSwap(
    version: string | number,
    data: ProcessDocument
  ): Promise<boolean>;
}
// The entire document and audit entry are saved together. A competing write is revalidated
// against its new state, so duplicate coffee pairs/claims cannot be committed concurrently.
export async function mutateProcess(
  store: ProcessStore,
  users: User[],
  user: User,
  body: Record<string, unknown>
) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const row = await store.read(),
      doc = structuredClone(row.data);
    const result = applyAction(doc, users, user, body);
    if (await store.compareAndSwap(row.version, doc)) return result;
  }
  return fail(
    "Another member updated this item. Please refresh and try again.",
    409
  );
}
