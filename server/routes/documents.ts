import { Router } from 'express';
import { sql } from '../db.js';
import { nanoid } from 'nanoid';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const docs = await sql`SELECT * FROM documents ORDER BY category, created_at DESC`;
    res.json(docs);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  const user = req.user!;
  if (!['exec', 'admin'].includes(user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { title, description, category, url, doc_type } = req.body;
  if (!title || !category || !url) return res.status(400).json({ error: 'title, category, url required' });
  try {
    const doc = await sql`
      INSERT INTO documents (id, title, description, category, url, doc_type, uploaded_by, created_at)
      VALUES (${nanoid()}, ${title}, ${description || null}, ${category}, ${url}, ${doc_type || 'link'}, ${user.id}, ${new Date().toISOString()})
      RETURNING *
    `;
    res.json(doc[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  const user = req.user!;
  if (!['exec', 'admin'].includes(user.role)) return res.status(403).json({ error: 'Forbidden' });
  try {
    await sql`DELETE FROM documents WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
