import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { requireAuth, requireExec } from '../middleware/auth.js';

const router = Router();

const VALID_EVENT_TYPES = ['general', 'social', 'professional', 'exec', 'mandatory'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/events
router.get('/', requireAuth, (_req, res) => {
  res.json([...db.data.events].sort((a, b) => a.date.localeCompare(b.date)));
});

// POST /api/events
router.post('/', requireExec, async (req, res) => {
  const { title, description, date, time, location, type } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'Title is required' }); return;
  }
  if (!date || (typeof date === 'string' && !DATE_RE.test(date) && isNaN(Date.parse(date)))) {
    res.status(400).json({ error: 'Valid date is required (YYYY-MM-DD)' }); return;
  }
  if (type && !VALID_EVENT_TYPES.includes(type)) {
    res.status(400).json({ error: `Type must be one of: ${VALID_EVENT_TYPES.join(', ')}` }); return;
  }
  const event = {
    id: nanoid(),
    title,
    description,
    date,
    time,
    location,
    type,
    createdBy: req.user!.id,
    createdAt: new Date().toISOString(),
  };
  db.data.events.push(event);
  await db.write();
  res.json(event);
});

// PUT /api/events/:id
router.put('/:id', requireExec, async (req, res) => {
  const event = db.data.events.find(e => e.id === req.params.id);
  if (!event) { res.status(404).json({ error: 'Not found' }); return; }

  const { title, description, date, time, location, type } = req.body;
  if (date !== undefined && typeof date === 'string' && !DATE_RE.test(date) && isNaN(Date.parse(date))) {
    res.status(400).json({ error: 'Valid date is required (YYYY-MM-DD)' }); return;
  }
  if (type !== undefined && !VALID_EVENT_TYPES.includes(type)) {
    res.status(400).json({ error: `Type must be one of: ${VALID_EVENT_TYPES.join(', ')}` }); return;
  }
  if (title !== undefined) event.title = title;
  if (description !== undefined) event.description = description;
  if (date !== undefined) event.date = date;
  if (time !== undefined) event.time = time;
  if (location !== undefined) event.location = location;
  if (type !== undefined) event.type = type;
  await db.write();
  res.json(event);
});

// DELETE /api/events/:id
router.delete('/:id', requireExec, async (req, res) => {
  db.data.events = db.data.events.filter(e => e.id !== req.params.id);
  await db.write();
  res.json({ success: true });
});

export default router;
