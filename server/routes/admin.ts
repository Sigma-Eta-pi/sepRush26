import { Router } from 'express';
import { nanoid } from 'nanoid';
import { sql } from '../db.js';
import { requireAdmin, requireExec } from '../middleware/auth.js';
import { sendPasswordResetEmail, sendBlastEmail } from '../email.js';

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

// Update role/email only — no password field exposed to admin
router.put('/users/:id', requireAdmin, async (req, res) => {
  const rows = await sql`SELECT id, email, role FROM users WHERE id = ${req.params.id} LIMIT 1`;
  if (rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }

  const { role, email } = req.body;
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
  await sql`UPDATE users SET role = ${newRole}, email = ${newEmail} WHERE id = ${req.params.id}`;
  res.json({ id: u.id, email: newEmail, role: newRole });
});

// Send password reset email
router.post('/users/:id/reset-password', requireAdmin, async (req, res) => {
  const rows = await sql`SELECT id, email FROM users WHERE id = ${req.params.id} LIMIT 1`;
  if (rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }
  const user = rows[0];

  // Invalidate old tokens
  await sql`UPDATE password_reset_tokens SET used = 1 WHERE user_id = ${req.params.id} AND used = 0`;

  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await sql`INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used) VALUES (${nanoid()}, ${req.params.id}, ${token}, ${expiresAt}, 0)`;

  try {
    await sendPasswordResetEmail(user.email, token);
    res.json({ success: true, message: `Password reset email sent to ${user.email}` });
  } catch (e: any) {
    console.error('Failed to send password reset email:', e);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  if (req.params.id === req.user!.id) { res.status(403).json({ error: 'Cannot delete yourself' }); return; }
  await sql`DELETE FROM profiles WHERE user_id = ${req.params.id}`;
  await sql`DELETE FROM tasks WHERE assigned_to = ${req.params.id}`;
  await sql`DELETE FROM password_reset_tokens WHERE user_id = ${req.params.id}`;
  await sql`DELETE FROM users WHERE id = ${req.params.id}`;
  res.json({ success: true });
});

// Email blast — exec or admin
router.post('/email-blast', requireExec, async (req, res) => {
  const { subject, content } = req.body;
  if (!subject?.trim() || !content?.trim()) { res.status(400).json({ error: 'Subject and content required' }); return; }

  const user = req.user!;
  const senderRows = await sql`SELECT name FROM profiles WHERE user_id = ${user.id} LIMIT 1`;
  const senderName = senderRows[0]?.name || user.email;

  // Send to all active users
  const recipients = await sql`SELECT email FROM users WHERE role = 'active'`;
  const emails = recipients.map(r => r.email as string);

  if (emails.length === 0) { res.json({ success: true, sent: 0, message: 'No active members to email' }); return; }

  try {
    await sendBlastEmail(emails, subject.trim(), content.trim(), senderName);
    res.json({ success: true, sent: emails.length, message: `Email sent to ${emails.length} active member${emails.length === 1 ? '' : 's'}` });
  } catch (e: any) {
    console.error('Blast email failed:', e);
    res.status(500).json({ error: 'Failed to send emails' });
  }
});

export default router;
