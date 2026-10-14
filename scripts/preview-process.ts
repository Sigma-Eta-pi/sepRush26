import { createSmsService } from "../server/sms/service";
import { smsRouter } from "../server/sms/router";
import { randomUUID } from "node:crypto";
import { createMcpBackend } from "../server/mcp/backend";
import {
  SepOAuthProvider,
  memoryAuthStore,
  createOAuthRoutes,
} from "../server/mcp/auth";
import { mcpHttpRouter } from "../server/mcp/http";
// Explicit loopback-only sample preview. No database connection and no production auth bypass.
import express from "express";
import { viewAsGuard, viewAsId } from "../server/process/view-as";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { randomBytes } from "node:crypto";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
} from "node:fs";
import path from "node:path";
import { applyAction, snapshot } from "../server/process/engine";
import { sampleWorkspace } from "../server/process/sample";
import { chapterDemo } from "../server/process/chapter-demo";
import {
  memberDirectoryRouter,
  readMemberDirectory,
} from "../server/process/member-directory";
import {
  applyProfileEdit,
  ownProfileRouter,
} from "../server/process/profile-edit";
const app = express();
app.use(express.json({ limit: "8mb" }));
app.use(cookieParser());
const dir = path.resolve(".local-preview");
mkdirSync(dir, { recursive: true });
const file = path.join(dir, "workspace.json");
let workspace = existsSync(file)
  ? JSON.parse(readFileSync(file, "utf8"))
  : sampleWorkspace();
if (
  workspace.demoRoster !== "chapter" &&
  readMemberDirectory().profiles.length
) {
  if (existsSync(file))
    copyFileSync(
      file,
      path.join(dir, `workspace-before-chapter-${Date.now()}.json`)
    );
  workspace = chapterDemo(readMemberDirectory().profiles);
}
if (workspace.demoRoster === "chapter") {
  const active = workspace.users.find(
    (user: any) => user.role === "active" && !user.archived
  );
  for (const strike of workspace.doc.records.strike || []) {
    if (
      active &&
      /^demo-strike-[0-2]$/.test(strike.id) &&
      strike.status === "reported" &&
      workspace.users.some(
        (user: any) => user.id === strike.reporterId && user.role === "master"
      )
    )
      strike.reporterId = active.id;
  }
}
for (const entry of workspace.doc.audit) {
  const matched = workspace.users.find(
    (user: any) => user.name === entry.actor
  );
  if (matched) entry.actor = matched.id;
}
let processVersion = 0;
const save = () => {
  processVersion++;
  writeFileSync(file, JSON.stringify(workspace));
};
save();
const sessions = new Map<string, string>();
const signedIn = (req: express.Request) =>
  workspace.users.find(
    (u: any) => u.id === sessions.get(req.cookies.sep_preview) && !u.archived
  );
// In the demo every pledge master stands in for a chapter admin.
app.use(
  "/api",
  viewAsGuard(req => signedIn(req)?.role === "master")
);
const actor = (req: express.Request) =>
  viewAsId(req)
    ? workspace.users.find(
        (u: any) => u.id === viewAsId(req) && !u.archived
      )
    : signedIn(req);
const authData = (u: any, token: string) => ({
  user: {
    id: u.id,
    email: u.email,
    role: u.role === "master" ? "pledge_master" : u.role,
    is_editor: false,
  },
  token,
  needsOnboarding: false,
  firstLogin: false,
});
const mcpAuthStore = memoryAuthStore();
const mcpBackend = createMcpBackend({
  users: async () => workspace.users,
  demo: true,
  store: {
    read: async () => ({
      version: processVersion,
      data: structuredClone(workspace.doc),
    }),
    compareAndSwap: async (version, data) => {
      if (version !== processVersion) return false;
      workspace.doc = data;
      save();
      return true;
    },
  },
  saveProfile: async (id, edit, actorId) => {
    const index = workspace.users.findIndex((u: any) => u.id === id);
    workspace.users[index] = applyProfileEdit(workspace.users[index], edit);
    workspace.doc.audit.unshift({
      id: Date.now(),
      actor: actorId,
      action: "profile.update",
      subject: `Profile updated · ${id}`,
      source: "mcp",
      at: new Date().toISOString(),
    });
    save();
  },
  archive: async (id, archived, actorId) => {
    workspace.users.find((u: any) => u.id === id).archived = archived;
    if (archived) await mcpAuthStore.revokeUser(id);
    workspace.doc.audit.unshift({
      id: Date.now(),
      actor: actorId,
      action: archived ? "profile.archive" : "profile.restore",
      subject: `Pledge ${archived ? "removed" : "restored"} · ${id}`,
      source: "mcp",
      at: new Date().toISOString(),
    });
    save();
  },
  extra: async () => ({
    records: {},
    unavailable: [
      "chapterUpdates",
      "chapterEvents",
      "chapterTasks",
      "documents",
      "classes",
      "siteContent",
    ],
  }),
});
const mcpProvider = new SepOAuthProvider(
  "http://localhost:4317",
  mcpAuthStore,
  mcpBackend
);
app.use(
  createOAuthRoutes(
    mcpProvider,
    (_req, _res, next) => next(),
    req => actor(req)?.id
  )
);
app.use("/api/mcp", mcpHttpRouter(mcpProvider));
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (
    req.headers.origin &&
    req.headers.origin !== `http://${req.get("host")}`
  ) {
    res.status(403).json({ error: "Same-origin requests only." });
    return;
  }
  next();
});
const smsPreviewService = createSmsService({
  users: async () => workspace.users,
  store: {
    read: async () => ({
      version: processVersion,
      data: structuredClone(workspace.doc),
    }),
    compareAndSwap: async (version, data) => {
      if (version !== processVersion) return false;
      workspace.doc = data;
      save();
      return true;
    },
  },
  dailyLimit: 100,
  // Explicit canned preview: no provider call or claim of live extraction.
  extract: async text => {
    const pledge = workspace.users.find(
      (u: any) =>
        u.role === "pledge" && text.startsWith(`Give ${u.name} a strike`)
    );
    if (!pledge) throw new Error("Use the sample text button in preview.");
    return {
      intent: "strike",
      pledgeName: pledge.name,
      reason: "Sample: arrived 20 minutes late to today’s meeting.",
      date: new Intl.DateTimeFormat("en-CA", {
        timeZone: workspace.doc.settings.timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
      points: 1,
    };
  },
});
app.use(
  "/api/sms",
  smsRouter({
    service: smsPreviewService,
    session: (req, res, next) => {
      if (!actor(req)) {
        res.status(401).json({ error: "Sign in to the preview." });
        return;
      }
      next();
    },
    identity: req => actor(req)?.id,
    enabled: () => false,
    configured: () => false,
    secret: () => "",
    decode: async () => {
      throw new Error("Live relay is disabled in preview.");
    },
    demo: async actorId => {
      const inbox = await smsPreviewService.inbox(actorId);
      const phone =
        inbox.bindings.find(b => b.userId === actorId)?.phone || "+12025550101";
      if (!inbox.bindings.some(b => b.userId === actorId))
        await smsPreviewService.bind(actorId, actorId, phone, true);
      const pledge = workspace.users.find(
        (u: any) => u.role === "pledge" && !u.archived
      );
      return smsPreviewService.receive({
        id: "demo-" + randomUUID(),
        phone,
        demo: true,
        receivedAt: new Date().toISOString(),
        text: `Give ${pledge.name} a strike for arriving 20 minutes late to today's meeting.`,
      });
    },
  })
);
app.get("/api/auth/config", (_req, res) =>
  res.json({ clientId: null, nonce: "", preview: true })
);
app.post("/api/auth/demo", (req, res) => {
  const u =
    workspace.users.find((u: any) => !u.archived && u.id === req.body.role) ||
    workspace.users.find((u: any) => !u.archived && u.role === req.body.role);
  if (!u) {
    res.status(400).json({ error: "Choose a sample member." });
    return;
  }
  const token = randomBytes(32).toString("hex");
  sessions.set(token, u.id);
  res.cookie("sep_preview", token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
  });
  res.json(authData(u, token));
});
app.get("/api/auth/me", (req, res) => {
  const u = actor(req);
  if (!u) {
    res.status(401).json({ error: "Sign in to the sample workspace." });
    return;
  }
  res.json(authData(u, req.cookies.sep_preview));
});
app.post("/api/auth/logout", (req, res) => {
  sessions.delete(req.cookies.sep_preview);
  res.clearCookie("sep_preview");
  res.json({ ok: true });
});
app.get("/api/content/:page", (_req, res) => res.json({ content: null }));
app.get("/api/profiles", (req, res) =>
  res.json(
    actor(req) ? workspace.users.map((u: any) => ({ ...u, userId: u.id })) : []
  )
);
app.use("/api", (req, res, next) => {
  if (!actor(req)) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }
  next();
});
app.get("/api/process/state", (req, res) =>
  res.json({
    ...snapshot(workspace.doc, workspace.users, actor(req), true),
    canViewAs: signedIn(req)?.role === "master",
    viewingAs: viewAsId(req)
      ? { viewerId: signedIn(req)?.id, viewerName: signedIn(req)?.name }
      : undefined,
    submissions: snapshot(
      workspace.doc,
      workspace.users,
      actor(req),
      true
    ).submissions.map(sub =>
      sub.id.startsWith("demo-submission-")
        ? {
            ...sub,
            url: `${req.protocol}://${req.get("host")}/api/process/demo-work/${encodeURIComponent(sub.id)}`,
          }
        : sub
    ),
    demoRoster: workspace.demoRoster,
  })
);
const escapeHtml = (value: string) =>
  String(value).replace(
    /[&<>"']/g,
    char =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!
  );
app.get("/api/process/demo-work/:id", (req, res) => {
  const user = actor(req);
  const sub = workspace.doc.records.submission.find(
    (item: any) =>
      item.id === req.params.id && item.id.startsWith("demo-submission-")
  );
  if (!sub || (user.role !== "master" && sub.pledgeId !== user.id)) {
    res.status(404).send("Submission unavailable.");
    return;
  }
  const assignment = workspace.doc.records.deliverable.find(
    (item: any) => item.id === sub.deliverableId
  );
  res
    .type("html")
    .send(
      `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>SEP sample submission</title><style>body{font:18px/1.7 system-ui;background:#f4f2ec;color:#233452;max-width:700px;margin:60px auto;padding:24px}a{color:inherit}</style></head><body><p>LOCAL DEMO · SAMPLE WORK</p><h1>${escapeHtml(assignment?.title || "Submission")}</h1><p>This is sample content for testing the submission and review flow. It is not this member’s actual work.</p><h2>Assignment</h2><p>${escapeHtml(assignment?.description || "")}</p><h2>Example response</h2><p>My goal is to learn how to interview customers, explain an idea clearly, and collaborate with the chapter. I will start with a specific problem, gather evidence through conversations, and revise my approach using feedback.</p><a href="/dashboard/deliverables">Return to deliverables</a></body></html>`
    );
});
app.use(
  "/api/process/directory",
  memberDirectoryRouter({
    hidden: () => workspace.users.filter((user: any) => user.archived),
  })
);
app.use(
  "/api/process/profile",
  ownProfileRouter({
    current: req => actor(req),
    members: () => workspace.users,
    archive: async (id, archived) => {
      if (archived) await mcpAuthStore.revokeUser(id);
      const user = workspace.users.find((u: any) => u.id === id);
      user.archived = archived;
      save();
    },
    save: (id, edit) => {
      const index = workspace.users.findIndex((user: any) => user.id === id);
      workspace.users[index] = applyProfileEdit(workspace.users[index], edit);
      save();
    },
  })
);
app.post("/api/process/actions", (req, res, next) => {
  try {
    const doc = structuredClone(workspace.doc);
    const result = applyAction(doc, workspace.users, actor(req), req.body);
    workspace.doc = doc;
    save();
    res.json(result);
  } catch (e) {
    next(e);
  }
});
app.post("/api/profiles", (req, res) => {
  const u = actor(req);
  for (const key of ["name", "phone", "major", "bio"])
    if (typeof req.body[key] === "string")
      u[key] = req.body[key].slice(0, key === "bio" ? 500 : 100);
  if (typeof req.body.gradYear === "string")
    u.year = req.body.gradYear.slice(0, 4);
  save();
  res.json(u);
});
app.use("/api", (_req, res) =>
  res.status(404).json({
    error: "This chapter tool is not included in the local sample preview.",
  })
);
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => res.status(err.status || 500).json({ error: err.message })
);
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "spa",
});
app.use(vite.middlewares);
app.listen(4317, "127.0.0.1", () =>
  console.log(
    "SEP website + member portal preview: http://127.0.0.1:4317/active-login"
  )
);
