import express from 'express';
import cookieParser from 'cookie-parser';
import { initDb } from '../server/db.js';
import authRouter from '../server/routes/auth.js';
import profilesRouter from '../server/routes/profiles.js';
import updatesRouter from '../server/routes/updates.js';
import eventsRouter from '../server/routes/events.js';
import adminRouter from '../server/routes/admin.js';
import uploadRouter from '../server/routes/upload.js';
import taskRouter from '../server/routes/tasks.js';
import classesRouter from '../server/routes/classes.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/updates', updatesRouter);
app.use('/api/events', eventsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/classes', classesRouter);

app.all('/api/*', (_req, res) => res.status(404).json({ error: 'Not found' }));

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    await initDb();
    initialized = true;
  }
  return app(req, res);
}
