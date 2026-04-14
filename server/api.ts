import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';
import authRouter from './routes/auth.js';
import profilesRouter from './routes/profiles.js';
import updatesRouter from './routes/updates.js';
import eventsRouter from './routes/events.js';
import adminRouter from './routes/admin.js';
import uploadRouter from './routes/upload.js';
import proxyRouter from './routes/proxy.js';
import classesRouter from './routes/classes.js';
import tasksRouter from './routes/tasks.js';
import contentRouter from './routes/content.js';
import documentsRouter from './routes/documents.js';
import gcalRouter from './routes/gcal.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function start() {
  await initDb();

  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // CORS for Vite dev server — in production, same-origin handles CORS
  if (process.env.NODE_ENV !== 'production') {
    app.use((_req, res, next) => {
      const origin = _req.headers.origin || '';
      if (origin.startsWith('http://localhost:')) res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      if (_req.method === 'OPTIONS') { res.sendStatus(200); return; }
      next();
    });
  }

  // Serve uploaded files
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'server', 'uploads')));

  app.use('/api/auth', authRouter);
  app.use('/api/profiles', profilesRouter);
  app.use('/api/updates', updatesRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api/proxy', proxyRouter);
  app.use('/api/classes', classesRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/content', contentRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api/gcal', gcalRouter);

  const port = parseInt(process.env.API_PORT || '3456');
  app.listen(port, () => console.log(`SEP API running on http://localhost:${port}`));
}

start().catch(console.error);
