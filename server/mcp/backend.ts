import type { User } from "../../client/src/member-portal/types.js";
import { chapterRoleForName } from "../../client/src/data/chapter-roster.js";
import { fail, snapshot } from "../process/engine.js";
import {
  applyProfileEdit,
  validateProfileEdit,
  type ProfileEdit,
} from "../process/profile-edit.js";
import type { ProcessStore } from "../process/store.js";
import { mutateFromMcp } from "./operations.js";
import type { McpBackend } from "./server.js";
export function createMcpBackend(options: {
  users: () => Promise<User[]>;
  store: ProcessStore;
  demo?: boolean;
  extra: (
    userId: string
  ) => Promise<{ records: Record<string, unknown[]>; unavailable: string[] }>;
  saveProfile: (
    id: string,
    edit: Partial<ProfileEdit>,
    actorId: string
  ) => Promise<void>;
  archive: (id: string, archived: boolean, actorId: string) => Promise<void>;
}): McpBackend {
  async function identity(userId: string) {
    const users = await options.users(),
      actor = users.find(u => u.id === userId && !u.archived);
    if (!actor) fail("Member access required.", 403);
    return { users, actor };
  }
  async function profileTarget(userId: string, targetId: string) {
    const { users, actor } = await identity(userId),
      target = users.find(u => u.id === targetId);
    if (
      !target ||
      (target.id !== actor.id &&
        (actor.role !== "master" || target.role !== "pledge"))
    )
      fail(
        "You can edit only your profile or, as a pledge master, pledge profiles.",
        403
      );
    return target;
  }
  return {
    state: async userId => {
      const { users, actor } = await identity(userId),
        row = await options.store.read();
      const result = snapshot(row.data, users, actor, options.demo);
      result.users = result.users.map(u => ({
        ...u,
        chapterRole: chapterRoleForName(u.directoryName || u.name) || null,
      }));
      if (actor.role === "master") {
        result.audit = row.data.audit;
        // Archived activity remains available for complete history, although the UI's current-class views hide it.
        result.coffee = row.data.records.coffee || [];
        result.makeups = row.data.records.makeup || [];
        result.submissions = row.data.records.submission || [];
      }
      return result;
    },
    action: async (userId, body, requestId) =>
      mutateFromMcp(options.store, options.users, userId, body, requestId),
    extra: async userId => {
      const { actor } = await identity(userId);
      if (actor.role === "pledge")
        return {
          records: {},
          unavailable: [
            "chapterUpdates",
            "chapterEvents",
            "chapterTasks",
            "documents",
            "classes",
            "siteContent",
          ],
        };
      return options.extra(userId);
    },
    editProfile: async (userId, targetId, changes) => {
      const target = await profileTarget(userId, targetId),
        edit = validateProfileEdit(changes);
      await options.saveProfile(targetId, edit, userId);
      return { ok: true, member: applyProfileEdit(target, edit) };
    },
    archiveProfile: async (userId, targetId, archived) => {
      const { actor, users } = await identity(userId);
      if (
        actor.role !== "master" ||
        !users.some(u => u.id === targetId && u.role === "pledge")
      )
        fail("Only pledge masters can archive pledge profiles.", 403);
      await options.archive(targetId, archived, userId);
      return { ok: true, memberId: targetId, archived };
    },
  };
}
