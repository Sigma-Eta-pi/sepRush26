import type { Express } from "express";
import { sql } from "../db.js";
import { optionalAuth } from "../middleware/auth.js";
import { roster, readProcess } from "../routes/process.js";
import { createMcpBackend } from "./backend.js";
import { SepOAuthProvider, createOAuthRoutes, type AuthStore } from "./auth.js";
import { mcpHttpRouter } from "./http.js";
const store: AuthStore = {
  get: async key =>
    (
      await sql`SELECT value FROM mcp_auth_state WHERE key=${key} AND expires_at>NOW()`
    )[0]?.value,
  put: async (key, value, expires) => {
    await sql`DELETE FROM mcp_auth_state WHERE expires_at<NOW()`;
    await sql`INSERT INTO mcp_auth_state(key,value,expires_at) VALUES(${key},${JSON.stringify(value)}::jsonb,${new Date(expires).toISOString()}::timestamptz) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, expires_at=EXCLUDED.expires_at`;
  },
  take: async key =>
    (
      await sql`DELETE FROM mcp_auth_state WHERE key=${key} AND expires_at>NOW() RETURNING value`
    )[0]?.value,
  revokeUser: async userId => {
    await sql`DELETE FROM mcp_auth_state WHERE value->>'userId'=${userId}`;
  },
  delete: async key => {
    await sql`DELETE FROM mcp_auth_state WHERE key=${key}`;
  },
};
export function installProductionMcp(app: Express) {
  if (process.env.MCP_ENABLED !== "true") return;
  const origin = new URL(process.env.APP_ORIGIN || "").origin;
  if (!origin.startsWith("https://") && process.env.NODE_ENV === "production")
    throw new Error("MCP requires an HTTPS APP_ORIGIN.");
  const backend = createMcpBackend({
    users: roster,
    store: {
      read: readProcess,
      compareAndSwap: async (version, doc) =>
        (
          await sql`UPDATE member_process_state SET data=${JSON.stringify(doc)}::jsonb, version=version+1 WHERE id='current' AND version=${version} RETURNING version`
        ).length > 0,
    },
    saveProfile: async (id, edit, actorId) => {
      await readProcess();
      const audit = JSON.stringify([
        {
          id: Date.now(),
          actor: actorId,
          action: "profile.update",
          subject: `Profile updated · ${id}`,
          source: "mcp",
          at: new Date().toISOString(),
        },
      ]);
      await sql.transaction([
        sql`INSERT INTO member_profile_edits(user_id,data) VALUES(${id},${JSON.stringify(edit)}::jsonb) ON CONFLICT(user_id) DO UPDATE SET data=member_profile_edits.data || EXCLUDED.data, updated_at=NOW()`,
        sql`UPDATE member_process_state SET data=jsonb_set(data,'{audit}',${audit}::jsonb || COALESCE(data->'audit','[]'::jsonb)), version=version+1 WHERE id='current'`,
      ]);
    },
    archive: async (id, archived, actorId) => {
      await readProcess();
      const audit = JSON.stringify([
        {
          id: Date.now(),
          actor: actorId,
          action: archived ? "profile.archive" : "profile.restore",
          subject: `Pledge ${archived ? "removed" : "restored"} · ${id}`,
          source: "mcp",
          at: new Date().toISOString(),
        },
      ]);
      await sql.transaction([
        sql`INSERT INTO member_profile_edits(user_id,archived) VALUES(${id},${archived}) ON CONFLICT(user_id) DO UPDATE SET archived=EXCLUDED.archived, updated_at=NOW()`,
        sql`UPDATE member_process_state SET data=jsonb_set(data,'{audit}',${audit}::jsonb || COALESCE(data->'audit','[]'::jsonb)), version=version+1 WHERE id='current'`,
        ...(archived
          ? [
              sql`DELETE FROM google_sessions WHERE user_id=${id}`,
              sql`DELETE FROM mcp_auth_state WHERE value->>'userId'=${id}`,
            ]
          : []),
      ]);
    },
    extra: async userId => {
      const account = (await sql`SELECT role FROM users WHERE id=${userId}`)[0];
      const [
        chapterUpdates,
        chapterEvents,
        chapterTasks,
        documents,
        classes,
        siteContent,
      ] = await Promise.all([
        sql`SELECT id,title,content,author_id,author_name,created_at,updated_at FROM updates ORDER BY created_at DESC`,
        sql`SELECT id,title,description,date,time,location,type,created_by,created_at,source FROM events ORDER BY date`,
        ["admin", "exec"].includes(account?.role)
          ? sql`SELECT id,title,description,assigned_to,assigned_by,assigned_by_name,due_date,status,created_at FROM tasks ORDER BY created_at DESC`
          : sql`SELECT id,title,description,assigned_to,assigned_by,assigned_by_name,due_date,status,created_at FROM tasks WHERE assigned_to=${userId} ORDER BY created_at DESC`,
        sql`SELECT id,title,description,category,url,doc_type,uploaded_by,created_at FROM documents ORDER BY created_at DESC`,
        sql`SELECT id,name,created_at FROM classes ORDER BY name`,
        sql`SELECT id,page,content_json,updated_at FROM site_content WHERE page IN ('home','about','careers','recruitment') ORDER BY page`,
      ]);
      return {
        records: {
          chapterUpdates,
          chapterEvents,
          chapterTasks,
          documents,
          classes,
          siteContent,
        },
        unavailable: [],
      };
    },
  });
  const provider = new SepOAuthProvider(origin, store, backend);
  app.use(createOAuthRoutes(provider, optionalAuth, req => req.user?.id));
  app.use("/api/mcp", mcpHttpRouter(provider));
}
