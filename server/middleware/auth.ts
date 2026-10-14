import { createHash } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../types.js";
import { sql } from "../db.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: UserRole; is_editor: boolean };
    }
  }
}
export const sessionHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const sessionToken = (req: Request): string | undefined =>
  req.cookies?.sep_google_session ||
  (req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined);
export function sameOrigin(req: Request, res: Response, next: NextFunction) {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.origin;
    const expected =
      process.env.APP_ORIGIN ||
      `${process.env.NODE_ENV === "production" ? "https" : req.protocol}://${req.get("host")}`;
    if (
      (origin && origin !== expected) ||
      req.headers["sec-fetch-site"] === "cross-site"
    ) {
      res
        .status(403)
        .json({ error: "Please use the SEP website to make this change." });
      return;
    }
  }
  res.setHeader("Cache-Control", "no-store");
  next();
}
async function resolveUser(req: Request) {
  const token = sessionToken(req);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return;
  const rows =
    await sql`SELECT u.id,u.email,u.role,u.is_editor FROM google_sessions s JOIN users u ON u.id=s.user_id LEFT JOIN member_profile_edits m ON m.user_id=u.id WHERE s.token_hash=${sessionHash(token)} AND s.expires_at>NOW() AND COALESCE(m.archived,FALSE)=FALSE`;
  if (rows[0])
    req.user = {
      ...rows[0],
      is_editor: !!rows[0].is_editor,
    } as Express.Request["user"];
}
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  resolveUser(req)
    .then(() => {
      if (!req.user)
        res.status(401).json({ error: "Please sign in with Google." });
      else next();
    })
    .catch(next);
}
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  resolveUser(req)
    .then(() => next())
    .catch(next);
}
const gate =
  (allowed: (u: NonNullable<Express.Request["user"]>) => boolean) =>
  (req: Request, res: Response, next: NextFunction) =>
    requireAuth(req, res, () => {
      if (!allowed(req.user!))
        res
          .status(403)
          .json({ error: "You do not have access to this action." });
      else next();
    });
export const requireAdmin = gate(u => u.role === "admin");
export const requireExec = gate(u => ["admin", "exec"].includes(u.role));
export const requireEditor = gate(
  u => ["admin", "exec"].includes(u.role) || u.is_editor
);

export const requireChapterMember = gate(u =>
  ["active", "exec", "admin", "pledge_master"].includes(u.role)
);
