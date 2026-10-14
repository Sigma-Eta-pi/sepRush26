import type { Page } from "./types";
export const chapterPages = [
  "updates",
  "chapter-calendar",
  "tasks",
  "connections",
  "alumni",
  "docs",
  "admin",
] as const;
export const processPages = [
  "today",
  "accountability",
  "calendar",
  "coffee",
  "deliverables",
  "questions",
  "members",
  "settings",
] as const;
export function dashboardPath(page: Page) {
  return page === "today" ? "/dashboard" : `/dashboard/${page}`;
}
export function dashboardPage(path: string, hash = ""): Page {
  const route = path.replace(/^\/dashboard\/?/, "").replace(/\/$/, "");
  const value =
    route === "process" || !route ? hash.replace(/^#/, "") || "today" : route;
  return [...processPages, ...chapterPages].includes(value as any)
    ? (value as Page)
    : "today";
}

export function visibleProcessPages(role: string) {
  return role === "active"
    ? ["today", "accountability", "calendar", "coffee", "members"]
    : processPages.filter(p => p !== "settings");
}

export const canAccessChapterTools = (role: string) =>
  ["master", "active"].includes(role);

// A page is reachable only when the same role can find it in the navigation.
export function canOpenPage(role: string, page: Page) {
  if ((chapterPages as readonly string[]).includes(page))
    return canAccessChapterTools(role);
  if (page === "settings") return role === "master";
  return (visibleProcessPages(role) as string[]).includes(page);
}
