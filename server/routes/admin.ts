import { Router } from 'express';
import { nanoid } from 'nanoid';
import { readFileSync } from 'fs';
import { join } from 'path';
import { sql } from '../db.js';
import { requireAdmin, requireExec } from '../middleware/auth.js';
import { sendPasswordResetEmail, sendBlastEmail } from '../email.js';

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuote = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuote = false;
      } else { field += ch; }
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (ch !== '\r') { field += ch; }
    }
    i++;
  }
  if (row.length > 0 || field) { row.push(field); if (row.some(Boolean)) rows.push(row); }
  return rows;
}

const router = Router();

router.get('/users', requireAdmin, async (_req, res) => {
  const rows = await sql`
    SELECT u.id, u.email, u.role, u.is_editor, u.created_at, p.name AS profile_name, p.pledge_class
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    ORDER BY u.created_at ASC
  `;
  res.json(rows.map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    is_editor: u.is_editor === 1,
    createdAt: u.created_at,
    name: u.profile_name || null,
    pledgeClass: u.pledge_class || null,
  })));
});

// Update role/email/pledgeClass — no password field exposed to admin
router.put('/users/:id', requireAdmin, async (req, res) => {
  const rows = await sql`SELECT id, email, role, is_editor FROM users WHERE id = ${req.params.id} LIMIT 1`;
  if (rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }

  const { role, email, is_editor, pledgeClass } = req.body;
  const u = rows[0];

  if (req.user!.id === req.params.id && role && role !== u.role) {
    res.status(403).json({ error: 'Cannot change your own role' }); return;
  }
  if (role && !['active', 'exec', 'admin', 'pnm'].includes(role)) {
    res.status(400).json({ error: 'Invalid role' }); return;
  }
  if (email && email !== u.email) {
    const conflict = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${req.params.id} LIMIT 1`;
    if (conflict.length > 0) { res.status(409).json({ error: 'Email already in use' }); return; }
  }

  const newRole = role ?? u.role;
  const newEmail = email?.trim() || u.email;
  const newIsEditor = typeof is_editor === 'boolean' ? (is_editor ? 1 : 0) : (u.is_editor ?? 0);
  await sql`UPDATE users SET role = ${newRole}, email = ${newEmail}, is_editor = ${newIsEditor} WHERE id = ${req.params.id}`;

  if (pledgeClass !== undefined) {
    const val = pledgeClass?.trim() || null;
    await sql`UPDATE profiles SET pledge_class = ${val} WHERE user_id = ${req.params.id}`;
  }
  res.json({ id: u.id, email: newEmail, role: newRole, is_editor: newIsEditor === 1 });
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
// recipient: 'actives' | 'pnms' | 'exec' | 'all' | 'individual'
// recipientId: userId (only when recipient === 'individual')
router.post('/email-blast', requireExec, async (req, res) => {
  const { subject, content, recipient = 'actives', recipientId } = req.body;
  if (!subject?.trim() || !content?.trim()) { res.status(400).json({ error: 'Subject and content required' }); return; }

  const user = req.user!;
  const senderRows = await sql`SELECT name FROM profiles WHERE user_id = ${user.id} LIMIT 1`;
  const senderName = senderRows[0]?.name || user.email;

  let rows: { email: string }[];
  if (recipient === 'individual') {
    if (!recipientId) { res.status(400).json({ error: 'recipientId required for individual send' }); return; }
    rows = await sql`SELECT email FROM users WHERE id = ${recipientId} LIMIT 1`;
  } else if (recipient === 'pnms') {
    rows = await sql`SELECT email FROM users WHERE role = 'pnm'`;
  } else if (recipient === 'exec') {
    rows = await sql`SELECT email FROM users WHERE role = 'exec'`;
  } else if (recipient === 'all') {
    rows = await sql`SELECT email FROM users WHERE role IN ('active', 'pnm', 'exec')`;
  } else {
    // default: actives
    rows = await sql`SELECT email FROM users WHERE role = 'active'`;
  }

  const emails = rows.map(r => r.email as string);
  if (emails.length === 0) { res.json({ success: true, sent: 0, message: 'No recipients found' }); return; }

  try {
    await sendBlastEmail(emails, subject.trim(), content.trim(), senderName);
    res.json({ success: true, sent: emails.length, message: `Email sent to ${emails.length} recipient${emails.length === 1 ? '' : 's'}` });
  } catch (e: any) {
    console.error('Blast email failed:', e);
    res.status(500).json({ error: 'Failed to send emails' });
  }
});

// One-time Notion CSV import — matches Active members by email, updates profile fields
router.post('/import-notion', requireAdmin, async (_req, res) => {
  try {
    const csvPath = join(process.cwd(), 'ExportBlock-a7fa3b93-7c4c-436d-8113-71878a69b865-Part-1', 'Member Profiles a96ad62df7d44a29bd4896e5b679c2c7.csv');
    const text = readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(text);
    if (rows.length < 2) { res.status(400).json({ error: 'CSV empty' }); return; }

    // col indices: 0=Name,2=Birthday,5=Class,10=Email,21=Hometown,22=Instagram,25=LinkedIn,26=Major,29=Phone,33=Status
    const activeRows = rows.slice(1).filter(r => r[33]?.trim() === 'Active' && r[0]?.trim());
    const results: { name: string; status: string; fields?: string }[] = [];
    const now = new Date().toISOString();

    for (const r of activeRows) {
      const name = r[0].trim();
      const email = r[10]?.trim() || '';
      const birthday = r[2]?.trim() || '';
      const pledgeClass = r[5]?.trim() || '';
      const hometown = r[21]?.trim() || '';
      const instagram = (r[22]?.trim() || '').replace(/^https?:\/\/(?:www\.)?instagram\.com\//i, '').replace(/\/$/, '').replace(/^@/, '');
      const linkedin = r[25]?.trim() || '';
      const major = r[26]?.trim() || '';
      const phone = r[29]?.trim() || '';

      // Match user by email, fallback to name
      let profileId: string | null = null;
      if (email) {
        const ur = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1`;
        if (ur.length > 0) {
          const pr = await sql`SELECT id FROM profiles WHERE user_id = ${ur[0].id} LIMIT 1`;
          if (pr.length > 0) profileId = pr[0].id;
        }
      }
      if (!profileId) {
        const pr = await sql`SELECT id FROM profiles WHERE LOWER(TRIM(name)) = LOWER(${name.toLowerCase()}) LIMIT 1`;
        if (pr.length > 0) profileId = pr[0].id;
      }
      if (!profileId) { results.push({ name, status: 'not_found' }); continue; }

      const updated: string[] = [];
      if (phone) updated.push('phone');
      if (linkedin) updated.push('linkedin');
      if (instagram) updated.push('instagram');
      if (hometown) updated.push('hometown');
      if (major) updated.push('major');
      if (birthday) updated.push('birthday');
      if (pledgeClass) updated.push('pledge_class');

      await sql`
        UPDATE profiles SET
          phone        = COALESCE(NULLIF(${phone}, ''), phone),
          linkedin     = COALESCE(NULLIF(${linkedin}, ''), linkedin),
          instagram    = COALESCE(NULLIF(${instagram}, ''), instagram),
          hometown     = COALESCE(NULLIF(${hometown}, ''), hometown),
          major        = COALESCE(NULLIF(${major}, ''), major),
          birthday     = COALESCE(NULLIF(${birthday}, ''), birthday),
          pledge_class = COALESCE(NULLIF(${pledgeClass}, ''), pledge_class),
          updated_at   = ${now}
        WHERE id = ${profileId}
      `;
      results.push({ name, status: 'updated', fields: updated.join(', ') || 'none' });
    }

    res.json({ success: true, active: activeRows.length, results });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
