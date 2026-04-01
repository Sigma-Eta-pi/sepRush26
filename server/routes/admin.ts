import { Router } from 'express';
import { sql } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/users', requireAdmin, async (_req, res) => {
  const rows = await sql`SELECT id, email, role, created_at FROM users`;
  res.json(rows.map(u => ({ id: u.id, email: u.email, role: u.role, createdAt: u.created_at })));
});

router.put('/users/:id', requireAdmin, async (req, res) => {
  const rows = await sql`SELECT id, email, role FROM users WHERE id = ${req.params.id} LIMIT 1`;
  if (rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }

  const { role } = req.body;
  if (!['active', 'exec', 'admin'].includes(role)) { res.status(400).json({ error: 'Invalid role' }); return; }

  await sql`UPDATE users SET role = ${role} WHERE id = ${req.params.id}`;
  res.json({ id: rows[0].id, email: rows[0].email, role });
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  if (req.params.id === req.user!.id) { res.status(403).json({ error: 'Cannot delete yourself' }); return; }

  await sql`DELETE FROM profiles WHERE user_id = ${req.params.id}`;
  await sql`DELETE FROM users WHERE id = ${req.params.id}`;
  res.json({ success: true });
});

export default router;
