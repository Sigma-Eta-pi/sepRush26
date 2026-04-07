import { Router } from "express";
import { nanoid } from "nanoid";
import { sql } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", async (_req, res) => {
  const rows = await sql`SELECT id, name FROM classes ORDER BY created_at ASC`;
  res.json(rows.map(r => ({ id: r.id, name: r.name })));
});

router.post("/", requireAdmin, async (req, res) => {
  const name = req.body.name?.trim();
  if (!name) {
    res.status(400).json({ error: "Name required" });
    return;
  }
  const existing =
    await sql`SELECT id FROM classes WHERE name = ${name} LIMIT 1`;
  if (existing.length > 0) {
    res.status(409).json({ error: "Class already exists" });
    return;
  }
  const id = nanoid();
  const now = new Date().toISOString();
  await sql`INSERT INTO classes (id, name, created_at) VALUES (${id}, ${name}, ${now})`;
  res.json({ id, name });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await sql`DELETE FROM classes WHERE id = ${req.params.id}`;
  res.json({ success: true });
});

export default router;
