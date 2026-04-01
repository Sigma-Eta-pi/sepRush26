import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/admin/users
router.get('/users', requireAdmin, (_req, res) => {
  res.json(db.data.users.map(u => ({ id: u.id, email: u.email, role: u.role, createdAt: u.createdAt })));
});

// PUT /api/admin/users/:id
router.put('/users/:id', requireAdmin, async (req, res) => {
  const user = db.data.users.find(u => u.id === req.params.id);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  const { role } = req.body;
  if (!['active', 'exec', 'admin'].includes(role)) {
    res.status(400).json({ error: 'Invalid role' }); return;
  }

  user.role = role;
  await db.write();
  res.json({ id: user.id, email: user.email, role: user.role });
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAdmin, async (req, res) => {
  if (req.params.id === req.user!.id) {
    res.status(403).json({ error: 'Cannot delete yourself' }); return;
  }

  db.data.users = db.data.users.filter(u => u.id !== req.params.id);
  db.data.profiles = db.data.profiles.filter(p => p.userId !== req.params.id);
  await db.write();
  res.json({ success: true });
});

export default router;
