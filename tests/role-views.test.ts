import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { AppContext } from "../client/src/member-portal/context";
import { sampleWorkspace } from "../server/process/sample";
import { snapshot } from "../server/process/engine";
import Calendar from "../client/src/member-portal/pages/Calendar";
import Coffee from "../client/src/member-portal/pages/Coffee";
import Deliverables from "../client/src/member-portal/pages/Deliverables";
import Accountability from "../client/src/member-portal/pages/Accountability";
import Members from "../client/src/member-portal/pages/Members";
vi.mock("@/data/chapter-members", () => ({
  chapterPhotoForName: () => undefined,
  chapterRoleForName: () => undefined,
  chapterClassForName: () => "Alpha",
  chapterMemberForName: () => undefined,
  PUBLIC_CHAPTER_MEMBERS: [],
  photoFor: () => undefined,
}));
beforeAll(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("sessionStorage", { getItem: () => null });
});
afterAll(() => vi.unstubAllGlobals());
function render(
  Component: React.ComponentType,
  role: "master" | "active" | "pledge"
) {
  const { users, doc } = sampleWorkspace();
  const actor = users.find(u => u.role === role)!;
  doc.records.coffee = doc.records.coffee.filter(
    c => !(c.activeId === actor.id && c.pledgeId === users[55].id)
  );
  const state = snapshot(doc, users, actor, true);
  return renderToStaticMarkup(
    React.createElement(
      AppContext.Provider,
      {
        value: {
          state,
          page: "today",
          navigate: vi.fn(),
          act: async () => ({}),
          openForm: vi.fn(),
          notify: vi.fn(),
          intent: null,
          refresh: async () => {},
        },
      },
      React.createElement(Component)
    )
  );
}
for (const role of ["master", "active", "pledge"] as const) {
  it(`${role} gets only authorized calendar and deliverable controls`, () => {
    const calendar = render(Calendar, role),
      work = render(Deliverables, role);
    expect(calendar.includes("Add event")).toBe(role === "master");
    expect(calendar.includes("Export calendar")).toBe(true);
    expect(work.includes("Add deliverable")).toBe(role === "master");
    expect(work.includes("View submissions")).toBe(role === "master");
    expect(work.includes("Submit work")).toBe(role === "pledge");
  });
  it(`${role} gets correct strike and profile actions`, () => {
    const strikes = render(Accountability, role),
      profiles = render(Members, role);
    expect(strikes.includes("Issue a strike")).toBe(role === "master");
    expect(strikes.includes("Report a strike")).toBe(role === "active");
    expect(strikes.includes("Pledge cards")).toBe(role === "master");
    expect(strikes.includes("Request a makeup")).toBe(role === "active");
    expect(profiles.includes("Manage pledges")).toBe(role === "master");
    expect(profiles.includes("Edit my profile")).toBe(true);
  });
  it(`${role} cannot use other roles' coffee controls`, () => {
    const coffee = render(Coffee, role);
    // Only pledges log; staff see the class chart and their own confirmations.
    expect(coffee.includes("Log chat")).toBe(role === "pledge");
    expect(coffee.includes("Class coffee chats")).toBe(role !== "pledge");
    expect(coffee.includes("Waiting for you to confirm")).toBe(
      role !== "pledge"
    );
  });
}
