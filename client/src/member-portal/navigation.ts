import {
  canAccessChapterTools,
  chapterPages,
  visibleProcessPages,
} from "./routing";
import type { Page } from "./types";

export type NavigationItem = { id: Page; label: string; hint: string };
export type NavigationGroup = { label: string; items: NavigationItem[] };
const destinations: NavigationGroup[] = [
  {
    label: "Your class",
    items: [
      {
        id: "today",
        label: "Overview",
        hint: "Progress, reviews and what needs your attention",
      },
      {
        id: "members",
        label: "The chapter",
        hint: "Member profiles, contact details and classes",
      },
      {
        id: "accountability",
        label: "Strikes & makeups",
        hint: "Report, review and make up strikes",
      },
    ],
  },
  {
    label: "Week to week",
    items: [
      {
        id: "calendar",
        label: "Calendar",
        hint: "Events and your upcoming schedule",
      },
      {
        id: "coffee",
        label: "Coffee chats",
        hint: "Track conversations and approve completed chats",
      },
      {
        id: "deliverables",
        label: "Deliverables",
        hint: "Assignments, submissions and deadlines",
      },
      {
        id: "questions",
        label: "Questions",
        hint: "Ask questions and find answers",
      },
    ],
  },
];
const chapter: Record<string, [string, string]> = {
  updates: ["Chapter updates", "Announcements from the chapter"],
  "chapter-calendar": ["Chapter calendar", "Events for active members"],
  tasks: ["My chapter tasks", "Chapter responsibilities and tasks"],
  connections: ["Connections", "Find connections within the chapter"],
  alumni: ["Alumni", "Connect with past members"],
  docs: ["Resources", "Shared chapter documents"],
  admin: ["Chapter administration", "Manage chapter accounts"],
};
// All menu surfaces, including search, share exactly the same permission filter.
export function navigationGroups(
  role: string,
  accountRole = ""
): NavigationGroup[] {
  const visible = visibleProcessPages(role);
  const groups = destinations.map(g => ({
    ...g,
    items: g.items
      .filter(i => visible.includes(i.id))
      .map(item => ({
        ...item,
        hint:
          role === "pledge" && item.id === "coffee"
            ? "Log completed chats and follow confirmations"
            : role === "pledge" && item.id === "accountability"
              ? "View your strikes, responses and makeup tasks"
              : item.hint,
      })),
  }));
  if (canAccessChapterTools(role))
    groups.push({
      label: "Chapter tools",
      items: chapterPages
        .filter(id => id !== "admin" || ["admin", "exec"].includes(accountRole))
        .map(id => ({ id, label: chapter[id][0], hint: chapter[id][1] })),
    });
  if (role === "master")
    groups.push({
      label: "Manage",
      items: [
        {
          id: "settings",
          label: "Process settings",
          hint: "Dates, requirements and chapter configuration",
        },
      ],
    });
  return groups;
}
