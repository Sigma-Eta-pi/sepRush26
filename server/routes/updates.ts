import { Router } from 'express';
import { nanoid } from 'nanoid';
import { sql } from '../db.js';
import { requireAuth, requireExec } from '../middleware/auth.js';

const router = Router();

function rowToUpdate(r: any) {
  return { id: r.id, title: r.title, content: r.content, authorId: r.author_id, authorName: r.author_name, createdAt: r.created_at, updatedAt: r.updated_at };
}

router.get('/', requireAuth, async (_req, res) => {
  const rows = await sql`SELECT * FROM updates ORDER BY created_at DESC`;
  res.json(rows.map(rowToUpdate));
});

router.post('/', requireExec, async (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim().slice(0, 200) : '';
  const content = typeof req.body.content === 'string' ? req.body.content.trim().slice(0, 5000) : '';
  if (!title) { res.status(400).json({ error: 'Title is required (max 200 chars)' }); return; }
  if (!content) { res.status(400).json({ error: 'Content is required (max 5000 chars)' }); return; }

  const profileRows = await sql`SELECT name FROM profiles WHERE user_id = ${req.user!.id} LIMIT 1`;
  const authorName = profileRows[0]?.name || req.user!.email;
  const id = nanoid();
  const now = new Date().toISOString();

  await sql`INSERT INTO updates (id, title, content, author_id, author_name, created_at, updated_at) VALUES (${id}, ${title}, ${content}, ${req.user!.id}, ${authorName}, ${now}, ${now})`;
  res.json({ id, title, content, authorId: req.user!.id, authorName, createdAt: now, updatedAt: now });
});

router.put('/:id', requireExec, async (req, res) => {
  const rows = await sql`SELECT * FROM updates WHERE id = ${req.params.id} LIMIT 1`;
  if (rows.length === 0) { res.status(404).json({ error: 'Not found' }); return; }
  const u = rows[0];

  const title = typeof req.body.title === 'string' && req.body.title.trim() ? req.body.title.trim().slice(0, 200) : u.title;
  const content = typeof req.body.content === 'string' && req.body.content.trim() ? req.body.content.trim().slice(0, 5000) : u.content;
  const now = new Date().toISOString();

  await sql`UPDATE updates SET title = ${title}, content = ${content}, updated_at = ${now} WHERE id = ${req.params.id}`;
  res.json(rowToUpdate({ ...u, title, content, updated_at: now }));
});

router.delete('/:id', requireExec, async (req, res) => {
  await sql`DELETE FROM updates WHERE id = ${req.params.id}`;
  res.json({ success: true });
});

export default router;
