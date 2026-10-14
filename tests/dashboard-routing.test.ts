import { it, expect } from "vitest";
import {
  dashboardPage,
  dashboardPath,
  chapterPages,
  processPages,
} from "../client/src/member-portal/routing";
it("makes the website dashboard the process landing page", () => {
  expect(dashboardPage("/dashboard")).toBe("today");
  expect(dashboardPath("today")).toBe("/dashboard");
});
it("keeps old portal bookmarks pointing to the same features", () => {
  expect(dashboardPage("/dashboard/process", "#coffee")).toBe("coffee");
  expect(dashboardPage("/dashboard/process", "#accountability")).toBe(
    "accountability"
  );
  expect(dashboardPage("/dashboard/process")).toBe("today");
});
it("uses website URLs for every process and existing chapter tool", () => {
  for (const p of [...chapterPages, ...processPages])
    expect(dashboardPage(dashboardPath(p))).toBe(p);
  expect(dashboardPage("/dashboard/members")).toBe("members");
  expect(dashboardPage("/dashboard/admin")).toBe("admin");
});

it("keeps actives focused on their five daily workflows", async () => {
  const { visibleProcessPages } = await import(
    "../client/src/member-portal/routing"
  );
  expect(visibleProcessPages("active")).toEqual([
    "today",
    "accountability",
    "calendar",
    "coffee",
    "members",
  ]);
  expect(visibleProcessPages("master")).toContain("deliverables");
  expect(visibleProcessPages("pledge")).toContain("questions");
});

it("restricts chapter navigation to chapter staff", async () => {
  const { canAccessChapterTools } = await import(
    "../client/src/member-portal/routing"
  );
  expect(canAccessChapterTools("pledge")).toBe(false);
  expect(canAccessChapterTools("pnm")).toBe(false);
  expect(canAccessChapterTools("active")).toBe(true);
  expect(canAccessChapterTools("master")).toBe(true);
});
