import {
  productionDirectory,
  productionDirectoryAsset,
} from "../process/directory-storage.js";
import { mutateProcess } from "../process/store.js";
import { applyProfileEdit, ownProfileRouter } from "../process/profile-edit.js";
import {
  enrichMemberProfiles,
  memberDirectoryRouter,
} from "../process/member-directory.js";
import { allowedLoginEmail } from "../google-identity.js";
import { Router } from "express";
import { sql } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { viewAsGuard, viewAsId } from "../process/view-as.js";
import {
  applyAction,
  emptyDocument,
  snapshot,
  fail,
  type ProcessDocument,
} from "../process/engine.js";
import type { User } from "../../client/src/member-portal/types.js";
const router = Router();
router.use(requireAuth);
// Chapter admins can load the portal as another member, read-only.
router.use(viewAsGuard(req => req.user!.role === "admin"));
router.use(
  "/directory",
  (req, res, next) => {
    if (
      !["active", "exec", "admin", "pledge", "pledge_master"].includes(
        req.user!.role
      )
    ) {
      res.status(403).json({ error: "Chapter member access required." });
      return;
    }
    next();
  },
  memberDirectoryRouter({
    read: productionDirectory,
    asset: productionDirectoryAsset,
    hidden: async () => (await roster()).filter(user => user.archived),
  })
);
export async function roster(): Promise<User[]> {
  const rows =
    await sql`SELECT DISTINCT ON(u.id) u.id,u.email,u.role,p.name,p.major,p.grad_year,p.phone,p.photo_url,p.bio,p.linkedin,p.instagram,p.pledge_class FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.role IN ('active','exec','admin','pledge','pledge_master') ORDER BY u.id,p.updated_at DESC`;
  const edits =
    await sql`SELECT user_id,data,archived FROM member_profile_edits`;
  return enrichMemberProfiles(
    rows
      .filter(r => allowedLoginEmail(r.email))
      .map(r => ({
        id: r.id,
        name: r.name || r.email.split("@")[0],
        email: r.email,
        role: ["admin", "pledge_master"].includes(r.role)
          ? "master"
          : r.role === "pledge"
            ? "pledge"
            : "active",
        major: r.major || "",
        year: r.grad_year || "",
        color: "blue",
        phone: r.phone || "",
        photoUrl: r.photo_url || "",
        bio: r.bio || "",
        linkedin: r.linkedin || "",
        instagram: r.instagram || "",
        pledgeClass: r.pledge_class || "",
      })),
    (await productionDirectory()).profiles
  ).map(user => {
    const edit = edits.find(row => row.user_id === user.id);
    return applyProfileEdit(
      { ...user, directoryName: user.name, archived: !!edit?.archived },
      edit?.data
    );
  });
}
router.use(
  "/profile",
  ownProfileRouter({
    current: async req =>
      (await roster()).find(
        user => user.id === (viewAsId(req) || req.user!.id) && !user.archived
      ),
    members: roster,
    archive: async (id, archived) => {
      await sql`INSERT INTO member_profile_edits(user_id,archived) VALUES(${id},${archived}) ON CONFLICT(user_id) DO UPDATE SET archived=EXCLUDED.archived, updated_at=NOW()`;
      if (archived) {
        await sql`DELETE FROM google_sessions WHERE user_id=${id}`;
        await sql`DELETE FROM mcp_auth_state WHERE value->>'userId'=${id}`;
      }
    },
    save: async (id, edit) => {
      await sql`INSERT INTO member_profile_edits(user_id,data) VALUES(${id},${JSON.stringify(edit)}::jsonb)
      ON CONFLICT(user_id) DO UPDATE SET data=member_profile_edits.data || EXCLUDED.data, updated_at=NOW()`;
    },
  })
);
export async function readProcess(): Promise<{
  version: string | number;
  data: ProcessDocument;
}> {
  await sql`INSERT INTO member_process_state(id,data) VALUES('current',${JSON.stringify(emptyDocument())}::jsonb) ON CONFLICT(id) DO NOTHING`;
  const row = (
    await sql`SELECT version,data FROM member_process_state WHERE id='current'`
  )[0];
  return { version: row.version, data: row.data as ProcessDocument };
}
router.get("/state", async (req, res, next) => {
  try {
    const users = await roster(),
      viewing = viewAsId(req),
      u = users.find(x => x.id === (viewing || req.user!.id));
    if (!u)
      fail(
        viewing
          ? "That member is no longer in the process."
          : "Your account has not been assigned a member-process role yet.",
        viewing ? 404 : 403
      );
    const row = await readProcess();
    res.json({
      ...snapshot(row.data as ProcessDocument, users, u),
      canViewAs: req.user!.role === "admin",
      viewingAs: viewing
        ? {
            viewerId: req.user!.id,
            viewerName:
              users.find(x => x.id === req.user!.id)?.name || req.user!.email,
          }
        : undefined,
    });
  } catch (e) {
    next(e);
  }
});
router.post("/actions", async (req, res, next) => {
  try {
    const users = await roster(),
      u = users.find(x => x.id === req.user!.id);
    if (!u) fail("Member access required.", 403);
    const result = await mutateProcess(
      {
        read: async () => {
          const row = await readProcess();
          return { version: row.version, data: row.data as ProcessDocument };
        },
        compareAndSwap: async (version, doc) => {
          const rows =
            await sql`UPDATE member_process_state SET data=${JSON.stringify(doc)}::jsonb, version=version+1 WHERE id='current' AND version=${version} RETURNING version`;
          return rows.length > 0;
        },
      },
      users,
      u,
      req.body
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
});
export default router;
