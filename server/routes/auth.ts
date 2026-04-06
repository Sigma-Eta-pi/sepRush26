import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { sql } from '../db.js';
import { signToken, requireAuth, requireAdmin } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../email.js';
import type { UserRole } from '../types.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES: UserRole[] = ['active', 'exec', 'admin'];

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt < now) { loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

router.post('/login', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) { res.status(429).json({ error: 'Too many login attempts. Try again in a minute.' }); return; }

  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ error: 'Email and password required' }); return; }

  const rows = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  const user = rows[0];
  if (!user) { res.status(401).json({ error: 'Invalid credentials' }); return; }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) { res.status(401).json({ error: 'Invalid credentials' }); return; }

  // Check if profile has been set up (has a name)
  const profileRows = await sql`SELECT name FROM profiles WHERE user_id = ${user.id} LIMIT 1`;
  const hasProfile = profileRows.length > 0 && !!profileRows[0].name;

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role }, needsOnboarding: !hasProfile });
});

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

// Admin creates a user — no password required; sends welcome email with set-password link
router.post('/register', requireAdmin, async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) { res.status(400).json({ error: 'Email and role required' }); return; }
  if (!EMAIL_RE.test(email)) { res.status(400).json({ error: 'Invalid email format' }); return; }
  if (!VALID_ROLES.includes(role)) { res.status(400).json({ error: 'Invalid role' }); return; }

  const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
  if (existing.length > 0) { res.status(400).json({ error: 'Email already exists' }); return; }

  const id = nanoid();
  const now = new Date().toISOString();
  // Use random temp hash; user must set password via email link
  const tempHash = await bcrypt.hash(nanoid(32), 10);
  await sql`INSERT INTO users (id, email, password_hash, role, created_at) VALUES (${id}, ${email.trim()}, ${tempHash}, ${role}, ${now})`;

  // Generate welcome / set-password token (24h)
  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await sql`INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used) VALUES (${nanoid()}, ${id}, ${token}, ${expiresAt}, 0)`;

  try { await sendWelcomeEmail(email.trim(), token); } catch (e) { console.error('Failed to send welcome email:', e); }

  res.json({ user: { id, email: email.trim(), role, createdAt: now }, inviteSent: true });
});

// Validate a reset token
router.get('/reset-password/:token', async (req, res) => {
  const rows = await sql`
    SELECT prt.*, u.email FROM password_reset_tokens prt
    JOIN users u ON u.id = prt.user_id
    WHERE prt.token = ${req.params.token} AND prt.used = 0
    LIMIT 1
  `;
  if (rows.length === 0) { res.status(400).json({ error: 'Invalid or expired link' }); return; }
  const row = rows[0];
  if (new Date(row.expires_at) < new Date()) { res.status(400).json({ error: 'Link has expired' }); return; }
  res.json({ valid: true, email: row.email });
});

// Set new password via token
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) { res.status(400).json({ error: 'Token and password required' }); return; }
  if (typeof password !== 'string' || password.length < 8) { res.status(400).json({ error: 'Password must be at least 8 characters' }); return; }

  const rows = await sql`
    SELECT * FROM password_reset_tokens WHERE token = ${token} AND used = 0 LIMIT 1
  `;
  if (rows.length === 0) { res.status(400).json({ error: 'Invalid or expired link' }); return; }
  const row = rows[0];
  if (new Date(row.expires_at) < new Date()) { res.status(400).json({ error: 'Link has expired' }); return; }

  const hash = await bcrypt.hash(password, 10);
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${row.user_id}`;
  await sql`UPDATE password_reset_tokens SET used = 1 WHERE id = ${row.id}`;

  const userRows = await sql`SELECT id, email, role FROM users WHERE id = ${row.user_id} LIMIT 1`;
  const user = userRows[0];

  const authToken = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({ success: true, token: authToken, user: { id: user.id, email: user.email, role: user.role } });
});

export default router;
