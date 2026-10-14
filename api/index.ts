import { installProductionSms } from "../server/sms/production.js";
import { installProductionMcp } from "../server/mcp/production.js";
import documentsRouter from "../server/routes/documents.js";
import gcalRouter from "../server/routes/gcal.js";
import processRouter from "../server/routes/process.js";
import { sameOrigin } from "../server/middleware/auth.js";
import express from "express";
import cookieParser from "cookie-parser";
import { initDb } from "../server/db.js";
import authRouter from "../server/routes/auth.js";
import profilesRouter from "../server/routes/profiles.js";
import updatesRouter from "../server/routes/updates.js";
import eventsRouter from "../server/routes/events.js";
import adminRouter from "../server/routes/admin.js";
import uploadRouter from "../server/routes/upload.js";
import taskRouter from "../server/routes/tasks.js";
import classesRouter from "../server/routes/classes.js";
import proxyRouter from "../server/routes/proxy.js";
import contentRouter from "../server/routes/content.js";

const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(cookieParser());

installProductionMcp(app);
app.use("/api", sameOrigin);
installProductionSms(app);
app.use("/api/process", processRouter);
app.use("/api/auth", authRouter);
app.use("/api/profiles", profilesRouter);
app.use("/api/updates", updatesRouter);
app.use("/api/events", eventsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/classes", classesRouter);
app.use("/api/proxy", proxyRouter);
app.use("/api/content", contentRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/gcal", gcalRouter);
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("API request failed:", err.status || 500);
    res.status(err.status || 500).json({
      error: err.status ? err.message : "Unable to save. Please try again.",
    });
  }
);

app.all("/api/*", (_req, res) => res.status(404).json({ error: "Not found" }));

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    await initDb();
    initialized = true;
  }
  return app(req, res);
}
