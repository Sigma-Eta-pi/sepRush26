import type { State, User } from "./types";
export const roleName = (role: string) =>
  ({ master: "Pledge master", pledge: "Pledge", active: "Active" })[role] ||
  role;
export const statusName = (s: string) =>
  ({
    complete: "Complete",
    requested: "Requested",
    scheduled: "Scheduled",
    pending: "Awaiting confirmation",
    reported: "Needs review",
    approved: "Approved",
    dismissed: "Dismissed",
    proposed: "Needs approval",
    open: "Available",
    claimed: "In progress",
    submitted: "In review",
    verified: "Owner confirmed",
    completed: "Completed · credit pending",
    changes_requested: "Changes requested",
    declined: "Declined",
    rejected: "Not approved",
    cancelled: "No longer needed",
    upheld: "Upheld",
  })[s] || s;
export const dateLabel = (
  s: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    ...options,
  }).format(new Date(s.length === 10 ? s + "T12:00:00-07:00" : s));
export const timeLabel = (s: string) =>
  dateLabel(s, { hour: "numeric", minute: "2-digit" });
export const dateKey = (s: string | Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(s));
export const inputDate = (s: string) => {
  const d = new Date(s);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
export const toISO = (s: string) => new Date(s).toISOString();
export const todayInput = () => new Date().toLocaleDateString("en-CA");
export const tomorrowInput = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(17, 0, 0, 0);
  return inputDate(d.toISOString());
};
export const findUser = (s: State, id: string | null) =>
  [...s.users, ...(s.archivedUsers || [])].find(u => u.id === id);
export function progress(s: State, u: User) {
  const activeIds = new Set(
    s.users
      .filter(member => member.role !== "pledge" && !member.archived)
      .map(member => member.id)
  );
  const coffee = new Set(
    s.coffee
      .filter(
        c =>
          c.pledgeId === u.id &&
          c.status === "complete" &&
          activeIds.has(c.activeId)
      )
      .map(c => c.activeId)
  ).size;
  const deliverableIds = new Set(s.deliverables.map(d => d.id));
  const done = Math.min(
    deliverableIds.size,
    s.classProgress.find(p => p.pledgeId === u.id)?.approvedDeliverables ??
      new Set(
        s.submissions
          .filter(
            x =>
              x.pledgeId === u.id &&
              x.status === "approved" &&
              deliverableIds.has(x.deliverableId)
          )
          .map(x => x.deliverableId)
      ).size
  );
  const total = s.settings.coffeeGoal + deliverableIds.size;
  return {
    coffee,
    done,
    percent: total
      ? Math.round(
          ((Math.min(coffee, s.settings.coffeeGoal) + done) / total) * 100
        )
      : 0,
  };
}
/** One pledge's chats with current actives: confirmed, awaiting, and how many to go. */
export function coffeeTally(s: State, pledgeId: string) {
  const activeIds = new Set(
    s.users.filter(u => u.role !== "pledge" && !u.archived).map(u => u.id)
  );
  const seen = new Set<string>();
  const mine = s.coffee
    .filter(c => c.pledgeId === pledgeId && activeIds.has(c.activeId))
    .sort(
      (a, b) =>
        Number(b.status === "complete") - Number(a.status === "complete") ||
        a.date.localeCompare(b.date)
    )
    .filter(c => {
      if (c.status === "declined" || seen.has(c.activeId)) return false;
      seen.add(c.activeId);
      return true;
    });
  const confirmed = mine.filter(c => c.status === "complete"),
    pending = mine.filter(c => c.status === "pending");
  return {
    confirmed,
    pending,
    left: Math.max(0, s.settings.coffeeGoal - confirmed.length),
  };
}
export function strikeBalance(s: State, pledgeId: string) {
  return s.strikes
    .filter(x => x.pledgeId === pledgeId && x.status === "approved")
    .reduce(
      (sum, strike) =>
        sum +
        Math.max(
          0,
          strike.points -
            s.makeups
              .filter(
                t =>
                  t.strikeId === strike.id &&
                  t.pledgeId === strike.pledgeId &&
                  t.status === "approved"
              )
              .reduce((n, t) => n + t.credit, 0)
        ),
      0
    );
}
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch("/api/process/" + path, {
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    method: body ? "POST" : "GET",
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Unable to save. Please try again.");
  return data;
}
export function downloadFile(
  content: string,
  name: string,
  type = "text/plain"
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportCalendar(s: State) {
  const escape = (v: string) =>
    v
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,");
  const stamp = (v: string) =>
    new Date(v)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const entries = [
    ...s.events.map(e => ({
      id: e.id,
      title: e.title,
      start: e.startsAt,
      end: e.endsAt,
      description: e.description,
      location: e.location,
    })),
    ...s.deliverables.map(d => ({
      id: d.id,
      title: `Due: ${d.title}`,
      start: d.dueAt,
      end: new Date(Date.parse(d.dueAt) + 15 * 60000).toISOString(),
      description: d.description,
      location: "",
    })),
    ...s.makeups
      .filter(
        t =>
          t.pledgeId &&
          (s.user.role === "master" ||
            t.pledgeId === s.user.id ||
            t.ownerId === s.user.id) &&
          !["approved", "completed", "rejected", "cancelled"].includes(t.status)
      )
      .map(t => ({
        id: t.id,
        title: `Makeup due: ${t.title}`,
        start: t.dueAt,
        end: new Date(Date.parse(t.dueAt) + 15 * 60000).toISOString(),
        description: t.description,
        location: "",
      })),
  ];
  downloadFile(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Sigma Eta Pi//Member Portal//EN",
      ...entries.flatMap(e => [
        "BEGIN:VEVENT",
        `UID:${e.id}@sep-portal`,
        `DTSTAMP:${stamp(new Date().toISOString())}`,
        `DTSTART:${stamp(e.start)}`,
        `DTEND:${stamp(e.end)}`,
        `SUMMARY:${escape(e.title)}`,
        `DESCRIPTION:${escape(e.description)}`,
        `LOCATION:${escape(e.location)}`,
        "END:VEVENT",
      ]),
      "END:VCALENDAR",
    ].join("\r\n"),
    "sep-schedule.ics",
    "text/calendar"
  );
}
