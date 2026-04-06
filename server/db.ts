import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

export const sql = neon(process.env.DATABASE_URL!);

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    )
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login INTEGER NOT NULL DEFAULT 1`;
  await sql`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT DEFAULT '',
      major TEXT,
      grad_year TEXT,
      hometown TEXT,
      birthday TEXT,
      bio TEXT,
      linkedin TEXT,
      instagram TEXT,
      phone TEXT,
      pledge_class TEXT,
      photo_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS updates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      time TEXT,
      location TEXT,
      type TEXT DEFAULT 'general',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      assigned_to TEXT NOT NULL,
      assigned_by TEXT NOT NULL,
      assigned_by_name TEXT NOT NULL,
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    )
  `;
  // Add first_login column if it doesn't exist — defaults to 1 so ALL existing users must change password
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login INTEGER NOT NULL DEFAULT 1`;

  const defaultClasses = ['Founder', 'Founding Class', 'Alpha Class'];
  for (const name of defaultClasses) {
    const cid = nanoid();
    const now = new Date().toISOString();
    await sql`INSERT INTO classes (id, name, created_at) VALUES (${cid}, ${name}, ${now}) ON CONFLICT (name) DO NOTHING`;
  }

  const admins = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
  if (admins.length === 0) {
    const hash = await bcrypt.hash('12345!', 10);
    await sql`
      INSERT INTO users (id, email, password_hash, role, created_at, first_login)
      VALUES (${nanoid()}, 'exec@ucsbsep.org', ${hash}, 'admin', ${new Date().toISOString()}, 1)
      ON CONFLICT (email) DO NOTHING
    `;
  }
}
