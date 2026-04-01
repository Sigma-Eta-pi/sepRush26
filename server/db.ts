import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import type { DbSchema } from './types.js';

const dbPath = path.resolve(process.cwd(), 'server', 'data', 'db.json');
const defaultData: DbSchema = { users: [], profiles: [], updates: [], events: [] };

export let db: Awaited<ReturnType<typeof JSONFilePreset<DbSchema>>>;

export async function initDb() {
  db = await JSONFilePreset<DbSchema>(dbPath, defaultData);

  // IMPORTANT: Change admin password immediately after first login in production
  if (!db.data.users.find(u => u.role === 'admin')) {
    const hash = await bcrypt.hash('12345!', 10);
    db.data.users.push({
      id: nanoid(),
      email: 'exec@ucsbsep.org',
      passwordHash: hash,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
    await db.write();
  }
}
