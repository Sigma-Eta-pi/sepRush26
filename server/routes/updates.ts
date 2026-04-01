import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { requireAuth, requireExec } from '../middleware/auth.js';

const router = Router();

// GET /api/updates
router.get('/', requireAuth, (_req, res) => {
  res.json([...db.data.updates].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

// POST /api/updates
router.post('/', requireExec, async (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim().slice(0, 200) : '';
  const content = typeof req.body.content === 'string' ? req.body.content.trim().slice(0, 5000) : '';
  if (!title) { res.status(400).json({ error: 'Title is required (max 200 chars)' }); return; }
  if (!content) { res.status(400).json({ error: 'Content is required (max 5000 chars)' }); return; }
  const profile = db.data.profiles.find(p => p.userId === req.user!.id);
  const now = new Date().toISOString();

  const update = {
    id: nanoid(),
    title,
    content,
    authorId: req.user!.id,
    authorName: profile?.name || req.user!.email,
    createdAt: now,
    updatedAt: now,
  };
  db.data.updates.push(update);
  await db.write();
  res.json(update);
});

// PUT /api/updates/:id
router.put('/:id', requireExec, async (req, res) => {
  const update = db.data.updates.find(u => u.id === req.params.id);
  if (!update) { res.status(404).json({ error: 'Not found' }); return; }

  if (typeof req.body.title === 'string' && req.body.title.trim()) {
    const t = req.body.title.trim().slice(0, 200);
    update.title = t;
  }
  if (typeof req.body.content === 'string' && req.body.content.trim()) {
    const c = req.body.content.trim().slice(0, 5000);
    update.content = c;
  }
  update.updatedAt = new Date().toISOString();
  await db.write();
  res.json(update);
});

// DELETE /api/updates/:id
router.delete('/:id', requireExec, async (req, res) => {
  db.data.updates = db.data.updates.filter(u => u.id !== req.params.id);
  await db.write();
  res.json({ success: true });
});

export default router;
