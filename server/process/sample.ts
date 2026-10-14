import { emptyDocument, type ProcessDocument } from "./engine.js";
import type { User } from "../../client/src/member-portal/types.js";
// Fictional fixture only. Never imported by production entrypoints.
export function sampleWorkspace() {
  const first = [
    "Alex",
    "Jordan",
    "Sam",
    "Taylor",
    "Morgan",
    "Riley",
    "Casey",
    "Avery",
    "Quinn",
    "Jamie",
    "Cameron",
    "Reese",
    "Skyler",
    "Drew",
    "Finley",
  ];
  const last = [
    "Brooks",
    "Chen",
    "Diaz",
    "Evans",
    "Foster",
    "Garcia",
    "Hayes",
    "Kim",
    "Lee",
    "Morris",
    "Nguyen",
    "Park",
    "Rivera",
    "Shah",
    "Wong",
  ];
  const users: User[] = Array.from({ length: 70 }, (_, i) => ({
    id: `sample-${i}`,
    name: `${first[i % 15]} ${last[Math.floor(i / 15) * 3 + (i % 3)]}`,
    role: i < 2 ? "master" : i < 55 ? "active" : "pledge",
    email: `sample${i}@ucsb.edu`,
    major: ["Economics", "Computer Science", "Communication", "Biology"][i % 4],
    year: String(2027 + (i % 4)),
    color: ["blue", "sage", "sand"][i % 3],
    phone: `+1202555${String(100 + i).padStart(4, "0")}`,
    bio: "Fictional member for previewing the chapter portal.",
    pledgeClass: i < 55 ? "Current actives" : "New-member class",
  }));
  const doc: ProcessDocument = emptyDocument();
  doc.settings.announcement =
    "Welcome to the sample workspace. Start by reviewing strike reports and makeup work, then check each pledge’s progress. Your real chapter schedule will replace these examples.";
  const future = (days: number, hour = 17) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  doc.records.event = [
    {
      id: "event-1",
      title: "New-member meeting",
      startsAt: future(1, 18),
      endsAt: future(1, 19),
      location: "Chapter meeting room · sample",
      description: "Weekly check-in and process questions.",
      type: "chapter",
      ownerId: users[0].id,
      rsvps: {},
    },
    {
      id: "event-2",
      title: "Pitch workshop",
      startsAt: future(3, 17),
      endsAt: future(3, 18),
      location: "Innovation room · sample",
      description: "Practice your opening pitch with the chapter.",
      type: "workshop",
      ownerId: users[0].id,
      rsvps: {},
    },
  ];
  doc.records.deliverable = [
    {
      id: "deliverable-1",
      title: "Personal introduction",
      description:
        "Share a short introduction and what you hope to build this quarter.",
      dueAt: future(2),
      ownerId: users[0].id,
    },
    {
      id: "deliverable-2",
      title: "First pitch deck",
      description: "Submit a link to your first pitch slides.",
      dueAt: future(7),
      ownerId: users[0].id,
    },
  ];
  doc.records.coffee = [];
  users
    .slice(55)
    .forEach((p, i) =>
      users
        .slice(0, 8 + (i % 11))
        .forEach((a, j) =>
          doc.records.coffee.push({
            id: `coffee-${i}-${j}`,
            pledgeId: p.id,
            activeId: a.id,
            status: j === 2 ? "pending" : "complete",
            date: future(-1),
            location: "",
            note: "",
            createdAt: future(-1),
          })
        )
    );
  doc.records.strike = users
    .slice(55, 60)
    .map((p, i) => ({
      id: `strike-${i}`,
      pledgeId: p.id,
      reporterId: users[2].id,
      reason: [
        "Late to the sample chapter meeting",
        "Sample deliverable submitted after deadline",
      ][i % 2],
      date: future(-1),
      status: i < 2 ? "reported" : "approved",
      points: 1,
      reviewNote: i < 2 ? "" : "Reviewed in sample process.",
      appeal: "",
      appealStatus: "",
      createdAt: future(-1),
    }));
  doc.records.makeup = [
    {
      id: "makeup-1",
      title: "Help prepare workshop materials",
      ownerId: users[2].id,
      description:
        "Organize the handouts and check the projector before the workshop.",
      dueAt: future(4),
      credit: 1,
      status: "open",
      pledgeId: null,
      strikeId: null,
      evidence: "",
      reviewNote: "",
    },
    {
      id: "makeup-2",
      title: "Organize the chapter resource folder",
      ownerId: users[2].id,
      description:
        "Sort resources into clear folders and remove duplicate links.",
      dueAt: future(5),
      credit: 1,
      status: "proposed",
      pledgeId: null,
      strikeId: null,
      evidence: "",
      reviewNote: "",
    },
    {
      id: "makeup-3",
      title: "Prepare workshop sign-in sheet",
      ownerId: users[2].id,
      description: "Prepare a clean sign-in sheet for the workshop.",
      dueAt: future(3),
      credit: 1,
      status: "submitted",
      pledgeId: users[57].id,
      strikeId: "strike-2",
      evidence: "The sample sign-in sheet is ready for review.",
      reviewNote: "",
    },
  ];
  doc.records.question = [
    {
      id: "question-1",
      title: "What should we prepare for the pitch workshop?",
      body: "Do we need a full deck or just our idea?",
      authorId: users[55].id,
      private: false,
      resolved: false,
      createdAt: future(-1),
      replies: [],
    },
  ];
  doc.records.submission = [];
  return { users, doc };
}
