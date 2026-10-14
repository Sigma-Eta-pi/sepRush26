import { sampleWorkspace } from "../server/process/sample";
import { createMcpBackend } from "../server/mcp/backend";
import { applyProfileEdit } from "../server/process/profile-edit";
export function mcpFixture() {
  const fixture = sampleWorkspace();
  let doc = fixture.doc,
    version = 0;
  const users = fixture.users;
  const store = {
    read: async () => ({ version, data: structuredClone(doc) }),
    compareAndSwap: async (v: string | number, d: typeof doc) => {
      if (v !== version) return false;
      version++;
      doc = d;
      return true;
    },
  };
  const backend = createMcpBackend({
    users: async () => users,
    store,
    demo: true,
    extra: async () => ({
      records: {
        documents: [
          {
            id: "doc-1",
            title: "Class handbook",
            description: "Handbook text",
            url: "https://example.com/handbook",
          },
        ],
      },
      unavailable: ["chapterUpdates"],
    }),
    saveProfile: async (id, edit) => {
      const index = users.findIndex(u => u.id === id);
      users[index] = applyProfileEdit(users[index], edit);
    },
    archive: async (id, archived) => {
      users.find(u => u.id === id)!.archived = archived;
    },
  });
  return {
    backend,
    users,
    get doc() {
      return doc;
    },
    master: users[0],
    active: users[2],
    pledge: users[57],
    other: users[58],
  };
}
