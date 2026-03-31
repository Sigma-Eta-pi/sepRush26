import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { signToken, requireAuth, requireAdmin } from '../middleware/auth.js';
import type { UserRole } from '../types.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES: UserRole[] = ['active', 'exec', 'admin'];

// Simple in-memory rate limiter for login
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: 'Too many login attempts. Try again in a minute.' }); return;
  }

  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' }); return;
  }

  const user = db.data.users.find(u => u.email === email);
  if (!user) { res.status(401).json({ error: 'Invalid credentials' }); return; }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) { res.status(401).json({ error: 'Invalid credentials' }); return; }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

// POST /api/auth/register (admin only)
router.post('/register', requireAdmin, async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    res.status(400).json({ error: 'Email, password, and role required' }); return;
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'Invalid email format' }); return;
  }
  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' }); return;
  }
  if (!VALID_ROLES.includes(role)) {
    res.status(400).json({ error: 'Role must be active, exec, or admin' }); return;
  }

  if (db.data.users.find(u => u.email === email)) {
    res.status(400).json({ error: 'Email already exists' }); return;
  }

  const user = {
    id: nanoid(),
    email: email.trim(),
    passwordHash: await bcrypt.hash(password, 10),
    role,
    createdAt: new Date().toISOString(),
  };
  db.data.users.push(user);
  await db.write();

  res.json({ user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt } });
});

export default router;
