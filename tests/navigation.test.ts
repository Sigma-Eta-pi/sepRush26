import { describe, expect, it } from "vitest";
import { navigationGroups } from "../client/src/member-portal/navigation";
import {
  dashboardPage,
  dashboardPath,
} from "../client/src/member-portal/routing";
const ids = (role: string, accountRole = "") =>
  navigationGroups(role, accountRole).flatMap(g => g.items.map(i => i.id));
describe("shared desktop, mobile and command navigation permissions", () => {
  it("never exposes chapter tools or process settings to pledges, even with an unrelated account role", () => {
    for (const accountRole of ["", "active", "admin", "exec"]) {
      expect(ids("pledge", accountRole)).toEqual([
        "today",
        "members",
        "accountability",
        "calendar",
        "coffee",
        "deliverables",
        "questions",
      ]);
    }
  });
  it("keeps actives focused on their workflows while allowing chapter tools", () => {
    const active = ids("active");
    for (const page of [
      "today",
      "members",
      "accountability",
      "calendar",
      "coffee",
      "docs",
    ])
      expect(active).toContain(page);
    for (const page of ["settings", "admin", "deliverables", "questions"])
      expect(active).not.toContain(page);
  });
  it("does not equate pledge master authority with website administration", () => {
    expect(ids("master")).toContain("settings");
    expect(ids("master")).not.toContain("admin");
    expect(ids("master", "exec")).toContain("admin");
  });
  it("keeps chapter above strikes and resolves every search result to a unique valid destination", () => {
    for (const role of ["master", "active", "pledge"]) {
      const pages = ids(role, "admin");
      expect(pages.indexOf("members")).toBeLessThan(
        pages.indexOf("accountability")
      );
      expect(new Set(pages).size).toBe(pages.length);
      for (const page of pages)
        expect(dashboardPage(dashboardPath(page))).toBe(page);
    }
  });
});
