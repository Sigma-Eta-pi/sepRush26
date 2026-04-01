import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { sql } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/users', requireAdmin, async (_req, res) => {
  const rows = await sql`
    SELECT u.id, u.email, u.role, u.created_at, p.name AS profile_name, p.pledge_class
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    ORDER BY u.created_at ASC
  `;
  res.json(rows.map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    createdAt: u.created_at,
    name: u.profile_name || null,
    pledgeClass: u.pledge_class || null,
  })));
});

router.put('/users/:id', requireAdmin, async (req, res) => {
  const rows = await sql`SELECT id, email, role FROM users WHERE id = ${req.params.id} LIMIT 1`;
  if (rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }

  const { role, email, password } = req.body;
  const u = rows[0];

  if (role && !['active', 'exec', 'admin'].includes(role)) {
    res.status(400).json({ error: 'Invalid role' }); return;
  }

  if (email && email !== u.email) {
    const conflict = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${req.params.id} LIMIT 1`;
    if (conflict.length > 0) { res.status(409).json({ error: 'Email already in use' }); return; }
  }

  const newRole = role ?? u.role;
  const newEmail = email?.trim() || u.email;

  if (password && password.trim()) {
    const hash = await bcrypt.hash(password.trim(), 10);
    await sql`UPDATE users SET role = ${newRole}, email = ${newEmail}, password_hash = ${hash} WHERE id = ${req.params.id}`;
  } else {
    await sql`UPDATE users SET role = ${newRole}, email = ${newEmail} WHERE id = ${req.params.id}`;
  }

  res.json({ id: u.id, email: newEmail, role: newRole });
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  if (req.params.id === req.user!.id) { res.status(403).json({ error: 'Cannot delete yourself' }); return; }

  await sql`DELETE FROM profiles WHERE user_id = ${req.params.id}`;
  await sql`DELETE FROM users WHERE id = ${req.params.id}`;
  res.json({ success: true });
});

export default router;
