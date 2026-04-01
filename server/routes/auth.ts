import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { sql } from '../db.js';
import { signToken, requireAuth, requireAdmin } from '../middleware/auth.js';
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

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

router.post('/register', requireAdmin, async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) { res.status(400).json({ error: 'Email, password, and role required' }); return; }
  if (!EMAIL_RE.test(email)) { res.status(400).json({ error: 'Invalid email format' }); return; }
  if (typeof password !== 'string' || password.length < 8) { res.status(400).json({ error: 'Password must be at least 8 characters' }); return; }
  if (!VALID_ROLES.includes(role)) { res.status(400).json({ error: 'Role must be active, exec, or admin' }); return; }

  const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
  if (existing.length > 0) { res.status(400).json({ error: 'Email already exists' }); return; }

  const id = nanoid();
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 10);
  await sql`INSERT INTO users (id, email, password_hash, role, created_at) VALUES (${id}, ${email.trim()}, ${passwordHash}, ${role}, ${now})`;

  res.json({ user: { id, email: email.trim(), role, createdAt: now } });
});

export default router;
