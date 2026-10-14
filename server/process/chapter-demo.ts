import {
  PUBLIC_CHAPTER_MEMBERS,
  chapterMemberForName,
  chapterClassForName,
} from "../../client/src/data/chapter-roster.js";
import type { User } from "../../client/src/member-portal/types.js";
import { emptyDocument } from "./engine.js";

// Local preview only: real directory profiles, explicitly fictional process activity.
export function chapterDemo(imported: User[]) {
  const key = (name: string) =>
    (chapterMemberForName(name)?.name || name)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  const roster = new Map<string, User>();
  for (const member of PUBLIC_CHAPTER_MEMBERS)
    roster.set(key(member.name), {
      id: `demo-${member.photoSlug}`,
      name: member.name,
      directoryName: member.name,
      role: "active",
      major: "",
      year: "",
      color: "blue",
      linkedin: member.linkedin,
      pledgeClass: chapterClassForName(member.name),
    });
  for (const member of imported) {
    const previous = roster.get(key(member.name));
    roster.set(key(member.name), {
      ...previous,
      ...member,
      id: previous?.id || `demo-${member.id}`,
      directoryName: member.name,
      pledgeClass: chapterClassForName(member.name),
      role: chapterClassForName(member.name) === "Alpha" ? "pledge" : "active",
    });
  }
  const users = [...roster.values()];
  const master = users.find(user => /^Piam\b/i.test(user.name));
  if (!master)
    throw new Error("Piam's chapter profile is required for this preview.");
  master.role = "master";
  users.sort(
    (a, b) =>
      Number(b.id === master.id) - Number(a.id === master.id) ||
      a.name.localeCompare(b.name)
  );
  const pledges = users.filter(user => user.role === "pledge");
  const actives = users.filter(user => user.role !== "pledge");
  const date = (days: number, hour = 18) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  const doc = emptyDocument();
  Object.assign(doc.settings, {
    cohort: "Alpha Class",
    term: "Fall 2026 · Demo",
    startDate: date(-14).slice(0, 10),
    endDate: date(42).slice(0, 10),
    welcome: "Your Alpha Class, at a glance.",
    announcement:
      "Demo: real chapter profiles with sample activity. Strikes, progress, deadlines, and conversations are examples, not actual member records.",
  });
  doc.records.event = [
    [
      "Alpha class check-in",
      0,
      "chapter",
      "Review this week's goals, coffee chats, and open questions.",
    ],
    [
      "Pitch fundamentals workshop",
      1,
      "workshop",
      "Bring a problem you care about and a one-minute introduction.",
    ],
    [
      "Chapter coffee catch-up",
      3,
      "social",
      "Optional group catch-up. Arrange individual coffee chats by text.",
    ],
    [
      "Customer discovery practice",
      5,
      "workshop",
      "Practice open-ended interview questions in small groups.",
    ],
    [
      "Weekly pledge meeting",
      7,
      "chapter",
      "Progress check, deliverable feedback, and next week's schedule.",
    ],
    [
      "Pitch night",
      12,
      "chapter",
      "Share your problem, evidence, and proposed solution.",
    ],
  ].map(([title, days, type, description], i) => ({
    id: `demo-event-${i}`,
    title,
    startsAt: date(Number(days)),
    endsAt: date(Number(days), 19),
    type,
    description,
    location: "Location to be confirmed · demo",
    ownerId: master.id,
    rsvps: Object.fromEntries(
      pledges.filter((_, j) => j % 3 !== i % 3).map(p => [p.id, "going"])
    ),
  }));
  doc.records.deliverable = [
    [
      "Personal introduction",
      -3,
      "Introduce yourself, your interests, and one goal for this quarter.",
    ],
    [
      "Problem discovery notes",
      1,
      "Describe a problem, who experiences it, and what you still need to learn.",
    ],
    [
      "Five customer interviews",
      5,
      "Summarize five conversations and the patterns you noticed.",
    ],
    [
      "First pitch deck",
      10,
      "Build a short deck covering the problem, customer, and your proposed solution.",
    ],
  ].map(([title, days, description], i) => ({
    id: `demo-deliverable-${i}`,
    title,
    description,
    dueAt: date(Number(days)),
    ownerId: master.id,
  }));
  doc.records.submission = pledges.flatMap((p, i) =>
    doc.records.deliverable.slice(0, i % 4 === 0 ? 1 : 2).map((d, j) => ({
      id: `demo-submission-${i}-${j}`,
      deliverableId: d.id,
      pledgeId: p.id,
      url: "https://example.com/demo-submission",
      note: "Example submission for previewing the review workflow.",
      status:
        j === 0 ? "approved" : i % 3 === 0 ? "changes_requested" : "submitted",
      feedback:
        j === 0
          ? "Demo feedback: clear introduction and goals."
          : i % 3 === 0
            ? "Demo feedback: add a specific customer example."
            : "",
      submittedAt: date(-2),
    }))
  );
  doc.records.coffee = pledges.flatMap((p, i) =>
    actives
      .slice(
        0,
        Math.min(
          actives.length,
          5 + ((i * 3) % Math.max(6, actives.length - 2))
        )
      )
      .map((a, j) => ({
        id: `demo-coffee-${i}-${j}`,
        pledgeId: p.id,
        activeId: a.id,
        status: j === i % 5 ? "pending" : "complete",
        date: date(-1 - (j % 12), 14),
        location: "",
        note: "Thank you for making time to meet. I learned a lot from hearing how you found your place in the chapter.",
        createdAt: date(-1 - (j % 12)),
      }))
  );
  doc.records.strike = pledges.slice(0, 12).map((p, i) => ({
    id: `demo-strike-${i}`,
    pledgeId: p.id,
    reporterId:
      i >= 3 && i % 3 === 0 ? master.id : actives[1 + (i % (actives.length - 1))].id,
    reason: [
      "Demo: late arrival to a meeting",
      "Demo: missed deliverable deadline",
      "Demo: missed check-in",
    ][i % 3],
    date: date(-2 - (i % 4)),
    status: i < 3 ? "reported" : i === 11 ? "dismissed" : "approved",
    points: i === 5 ? 2 : 1,
    reviewNote: i < 3 ? "" : "Sample review for the demo.",
    appeal:
      i === 6 ? "Demo: I shared the scheduling conflict ahead of time." : "",
    appealStatus: i === 6 ? "pending" : "",
    createdAt: date(-2 - (i % 4)),
  }));
  doc.records.makeup = [
    ["Prepare workshop materials", "open", null, null],
    ["Organize the chapter resource folder", "proposed", null, null],
    ["Set up the pitch-night room", "claimed", 3, 3],
    ["Create a workshop sign-in sheet", "submitted", 4, 4],
    ["Summarize customer discovery resources", "verified", 5, 5],
    ["Help with chapter event cleanup", "approved", 7, 7],
  ].map(([title, status, p, s], i) => ({
    id: `demo-makeup-${i}`,
    title,
    status,
    ownerId: actives[1 + (i % (actives.length - 1))].id,
    description:
      "Demo opportunity: coordinate with the task owner, complete the task, and submit a short summary.",
    dueAt: date(2 + i),
    credit: 1,
    pledgeId: typeof p === "number" ? pledges[p]?.id : null,
    strikeId: typeof s === "number" ? `demo-strike-${s}` : null,
    evidence: ["submitted", "verified", "approved"].includes(String(status))
      ? "Demo evidence: the task is complete and ready for review."
      : "",
    reviewNote:
      status === "approved"
        ? "Demo: completion verified and credit awarded."
        : "",
  }));
  doc.records.question = [
    [
      "What should we bring to the pitch workshop?",
      "Do we need a full deck or just our idea?",
      false,
      false,
      "Bring your idea and a one-minute explanation. We'll build the deck together.",
    ],
    [
      "How do coffee-chat approvals work?",
      "Should I log the chat before or after we meet?",
      false,
      true,
      "Log it after you meet. The active will then confirm it here.",
    ],
    [
      "Can I discuss a schedule conflict?",
      "Demo private question: I have a class conflict with the next meeting.",
      true,
      false,
      "",
    ],
    [
      "Where should interview notes go?",
      "Is there a required format for our discovery notes?",
      false,
      false,
      "",
    ],
  ].map(([title, body, isPrivate, resolved, reply], i) => ({
    id: `demo-question-${i}`,
    title,
    body,
    private: isPrivate,
    resolved,
    authorId: pledges[i % pledges.length].id,
    createdAt: date(-1 - i),
    replies: reply
      ? [
          {
            id: `demo-reply-${i}`,
            authorId: master.id,
            body: reply,
            createdAt: date(-1),
          },
        ]
      : [],
  }));
  doc.audit = [
    {
      id: 1,
      actor: master.id,
      action: "demo.initialized",
      subject:
        "Demo initialized with chapter profiles and sample process records",
      at: date(0, 9),
    },
    {
      id: 2,
      actor: master.id,
      action: "makeup.review",
      subject: "Demo makeup credit awarded",
      at: date(-1),
    },
    {
      id: 3,
      actor: master.id,
      action: "deliverable.review",
      subject: "Demo introductions reviewed",
      at: date(-2),
    },
  ];
  return { users, doc, demoRoster: "chapter" as const, seedVersion: 1 };
}
