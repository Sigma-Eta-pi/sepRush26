import { Router } from "express";
import { nanoid } from "nanoid";
import { sql } from "../db.js";
import { requireAuth, requireExec } from "../middleware/auth.js";

const router = Router();
const VALID_EVENT_TYPES = [
  "general",
  "social",
  "professional",
  "exec",
  "mandatory",
];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function rowToEvent(r: any) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    date: r.date,
    time: r.time,
    location: r.location,
    type: r.type,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

router.get("/", requireAuth, async (_req, res) => {
  const rows = await sql`SELECT * FROM events ORDER BY date ASC`;
  res.json(rows.map(rowToEvent));
});

router.post("/", requireExec, async (req, res) => {
  const { title, description, date, time, location, type } = req.body;
  if (!title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  if (
    !date ||
    (typeof date === "string" && !DATE_RE.test(date) && isNaN(Date.parse(date)))
  ) {
    res.status(400).json({ error: "Valid date is required (YYYY-MM-DD)" });
    return;
  }
  if (type && !VALID_EVENT_TYPES.includes(type)) {
    res
      .status(400)
      .json({ error: `Type must be one of: ${VALID_EVENT_TYPES.join(", ")}` });
    return;
  }

  const id = nanoid();
  const now = new Date().toISOString();
  await sql`INSERT INTO events (id, title, description, date, time, location, type, created_by, created_at) VALUES (${id}, ${title}, ${description ?? null}, ${date}, ${time ?? null}, ${location ?? null}, ${type || "general"}, ${req.user!.id}, ${now})`;
  res.json({
    id,
    title,
    description,
    date,
    time,
    location,
    type: type || "general",
    createdBy: req.user!.id,
    createdAt: now,
  });
});

router.put("/:id", requireExec, async (req, res) => {
  const rows =
    await sql`SELECT * FROM events WHERE id = ${req.params.id} LIMIT 1`;
  if (rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const e = rows[0];

  const { title, description, date, time, location, type } = req.body;
  if (
    date !== undefined &&
    typeof date === "string" &&
    !DATE_RE.test(date) &&
    isNaN(Date.parse(date))
  ) {
    res.status(400).json({ error: "Valid date is required (YYYY-MM-DD)" });
    return;
  }
  if (type !== undefined && !VALID_EVENT_TYPES.includes(type)) {
    res
      .status(400)
      .json({ error: `Type must be one of: ${VALID_EVENT_TYPES.join(", ")}` });
    return;
  }

  await sql`
    UPDATE events SET
      title = ${title ?? e.title},
      description = ${description ?? e.description},
      date = ${date ?? e.date},
      time = ${time ?? e.time},
      location = ${location ?? e.location},
      type = ${type ?? e.type}
    WHERE id = ${req.params.id}
  `;
  const updated =
    await sql`SELECT * FROM events WHERE id = ${req.params.id} LIMIT 1`;
  res.json(rowToEvent(updated[0]));
});

router.delete("/:id", requireExec, async (req, res) => {
  await sql`DELETE FROM events WHERE id = ${req.params.id}`;
  res.json({ success: true });
});

export default router;
