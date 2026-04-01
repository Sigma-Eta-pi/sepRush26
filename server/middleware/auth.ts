import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sep-jwt-secret-dev-CHANGE-THIS-IN-PRODUCTION-min-32-chars';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: UserRole };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.slice(7);
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try {
    req.user = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole };
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

export function requireExec(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'exec' && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Exec or admin required' }); return;
    }
    next();
  });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin required' }); return;
    }
    next();
  });
}

export function signToken(payload: { id: string; email: string; role: UserRole }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}
