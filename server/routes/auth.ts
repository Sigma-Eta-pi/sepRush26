import { Router } from "express";
import { randomBytes, randomUUID } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { sql } from "../db.js";
import {
  requireAdmin,
  requireAuth,
  sessionHash,
  sessionToken,
  sameOrigin,
} from "../middleware/auth.js";
import { allowedLoginEmail, validateGoogleIdentity } from "../google-identity.js";
const router = Router();
const cookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
const client = new OAuth2Client();
router.use(sameOrigin);
router.get("/config", (_req, res) => {
  const nonce = randomBytes(24).toString("hex");
  res.cookie("sep_google_nonce", nonce, { ...cookie, maxAge: 10 * 60 * 1000 });
  res.json({
    clientId: process.env.GOOGLE_CLIENT_ID || null,
    nonce,
    preview: false,
  });
});
router.post("/google", async (req, res, next) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      res
        .status(503)
        .json({ error: "Google sign-in is awaiting chapter setup." });
      return;
    }
    if (
      typeof req.body.credential !== "string" ||
      req.body.credential.length > 12000
    ) {
      res.status(400).json({ error: "Missing Google credential." });
      return;
    }
    let identity;
    try {
      const ticket = await client.verifyIdToken({
        idToken: req.body.credential,
        audience: clientId,
      });
      identity = validateGoogleIdentity(
        ticket.getPayload(),
        req.cookies?.sep_google_nonce
      );
    } catch (e) {
      res.status(401).json({
        error:
          e instanceof Error && e.message.startsWith("Use your")
            ? e.message
            : "Unable to verify this Google sign-in. Refresh and try again.",
      });
      return;
    }
    res.clearCookie("sep_google_nonce", cookie);
    // Exact, verified email matching preserves existing IDs without guessing school aliases.
    const matches =
      await sql`SELECT id,email,role,is_editor,google_sub FROM users WHERE LOWER(email)=${identity.email}`;
    if (matches.length !== 1) {
      res.status(403).json({
        error:
          "Your Google account is not on the chapter roster yet. Ask a chapter administrator to add this exact Google email.",
      });
      return;
    }
    const u = matches[0];
    const bound =
      await sql`UPDATE users SET google_sub=${identity.sub}, first_login=0 WHERE id=${u.id} AND LOWER(email)=${identity.email} AND (google_sub IS NULL OR google_sub=${identity.sub}) RETURNING id`;
    if (!bound.length) {
      res.status(403).json({
        error:
          "This member account is linked to a different Google identity. Contact a chapter administrator.",
      });
      return;
    }
    const token = randomBytes(32).toString("hex");
    const issued =
      await sql`INSERT INTO google_sessions(token_hash,user_id,expires_at)
      SELECT ${sessionHash(token)},id,${new Date(Date.now() + 7 * 86400000).toISOString()}::timestamptz
      FROM users WHERE id=${u.id} AND LOWER(email)=${identity.email} AND google_sub=${identity.sub}
      RETURNING token_hash`;
    if (!issued.length) {
      res
        .status(409)
        .json({
          error:
            "Your chapter account changed during sign-in. Refresh and try again.",
        });
      return;
    }
    const profiles =
      await sql`SELECT name FROM profiles WHERE user_id=${u.id} ORDER BY updated_at DESC LIMIT 1`;
    res.cookie("sep_google_session", token, {
      ...cookie,
      maxAge: 7 * 86400000,
    });
    res.json({
      token,
      user: {
        id: u.id,
        email: u.email,
        role: u.role,
        is_editor: !!u.is_editor,
      },
      needsOnboarding: !profiles[0]?.name,
      firstLogin: false,
    });
  } catch (e) {
    next(e);
  }
});
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const profiles =
      await sql`SELECT name FROM profiles WHERE user_id=${req.user!.id} ORDER BY updated_at DESC LIMIT 1`;
    res.json({
      user: req.user,
      token: sessionToken(req),
      needsOnboarding: !profiles[0]?.name,
      firstLogin: false,
    });
  } catch (e) {
    next(e);
  }
});
router.post("/logout", async (req, res, next) => {
  try {
    const token = sessionToken(req);
    if (token)
      await sql`DELETE FROM google_sessions WHERE token_hash=${sessionHash(token)}`;
    res.clearCookie("sep_google_session", cookie);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
router.post("/register", requireAdmin, async (req, res, next) => {
  try {
    const email = String(req.body.email || "")
        .trim()
        .toLowerCase(),
      role = req.body.role || "active";
    if (
      !allowedLoginEmail(email) ||
      !["active", "exec", "admin", "pnm", "pledge", "pledge_master"].includes(
        role
      )
    ) {
      res.status(400).json({ error: "Enter an approved Google email and a valid role." });
      return;
    }
    const existing =
      await sql`SELECT id FROM users WHERE LOWER(email)=${email}`;
    if (existing.length) {
      res.status(409).json({ error: "This email is already registered." });
      return;
    }
    const id = randomUUID();
    await sql`INSERT INTO users(id,email,password_hash,role,created_at,first_login) VALUES(${id},${email},'google-only',${role},${new Date().toISOString()},0)`;
    res.status(201).json({
      id,
      email,
      role,
      message: "Member added. They can sign in with their UCSB Google account.",
    });
  } catch (e) {
    next(e);
  }
});
router.all(
  [
    "/login",
    "/change-password",
    "/reset-password",
    "/reset-password/:token",
    "/validate-reset/:token",
  ],
  (_req, res) =>
    res.status(410).json({
      error:
        "Password sign-in has been retired. Sign in with your UCSB Google account.",
    })
);
export default router;
