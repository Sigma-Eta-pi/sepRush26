import express from "express";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initDb } from "./db.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profiles.js";
import updateRoutes from "./routes/updates.js";
import eventRoutes from "./routes/events.js";
import adminRoutes from "./routes/admin.js";
import uploadRoutes from "./routes/upload.js";
import taskRoutes from "./routes/tasks.js";
import proxyRoutes from "./routes/proxy.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await initDb();

  const app = express();
  const server = createServer(app);

  const uploadsDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.use(express.json({ limit: "10mb" }));
  app.use(cookieParser());

  app.use("/uploads", express.static(uploadsDir));

  app.use("/api/auth", authRoutes);
  app.use("/api/profiles", profileRoutes);
  app.use("/api/updates", updateRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/proxy", proxyRoutes);

  app.all("/api/*", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
