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

  // Fix pledge_class: founding class members (non-exec) were seeded as 'Founder', correct to 'Founding Class'
  try {
    await sql`
      UPDATE profiles SET pledge_class = 'Founding Class'
      WHERE pledge_class = 'Founder'
      AND user_id IN (SELECT id FROM users WHERE role NOT IN ('exec', 'admin'))
    `;
  } catch (e) { console.error('pledge_class migration failed:', e); }

  // Clear auto-generated linkedin + photos for active members pending onboarding
  try {
    await sql`
      UPDATE profiles SET linkedin = NULL, photo_url = NULL
      WHERE user_id IN (SELECT id FROM users WHERE first_login = 1 AND role NOT IN ('exec', 'admin'))
    `;
  } catch (e) { console.error('linkedin/photo cleanup migration failed:', e); }

  // Dedup: remove duplicate profile rows, keeping the most recently updated per user
  try {
    await sql`
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC, id DESC) AS rn
        FROM profiles
      )
      DELETE FROM profiles WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
    `;
  } catch (e) { console.error('profile dedup migration failed:', e); }

  const defaultClasses = ['Founder', 'Founding Class', 'Alpha Class'];
  for (const name of defaultClasses) {
    const cid = nanoid();
    const now = new Date().toISOString();
    await sql`INSERT INTO classes (id, name, created_at) VALUES (${cid}, ${name}, ${now}) ON CONFLICT (name) DO NOTHING`;
  }

  const admins = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
  if (admins.length === 0) {
    const hash = await bcrypt.hash('12345!', 10);
    const adminId = nanoid();
    const now = new Date().toISOString();
    await sql`
      INSERT INTO users (id, email, password_hash, role, created_at, first_login)
      VALUES (${adminId}, 'exec@ucsbsep.org', ${hash}, 'admin', ${now}, 1)
      ON CONFLICT (email) DO NOTHING
    `;
  }

  // Migrate @ucsbsep.org accounts → merge into matching @ucsb.edu accounts by profile name
  try {
    const sepUsers = await sql`
      SELECT u.id AS user_id, u.email, p.id AS profile_id, p.name, p.photo_url, p.linkedin
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.email LIKE '%@ucsbsep.org' AND u.email != 'exec@ucsbsep.org'
    `;
    for (const sep of sepUsers) {
      if (!sep.name) {
        // No profile — just delete the orphan account
        await sql`DELETE FROM users WHERE id = ${sep.user_id}`;
        continue;
      }
      const match = await sql`
        SELECT u.id AS user_id, p.id AS profile_id, p.photo_url, p.linkedin
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        WHERE u.email LIKE '%@ucsb.edu'
        AND lower(trim(p.name)) = lower(trim(${sep.name}))
        LIMIT 1
      `;
      if (match.length > 0) {
        const edu = match[0];
        // Transfer photo/linkedin to @ucsb.edu profile if it doesn't have them
        if (edu.profile_id) {
          await sql`
            UPDATE profiles SET
              photo_url = COALESCE(photo_url, ${sep.photo_url ?? null}),
              linkedin  = COALESCE(linkedin,  ${sep.linkedin  ?? null})
            WHERE id = ${edu.profile_id}
          `;
        }
        // Delete @ucsbsep.org profile and user
        if (sep.profile_id) await sql`DELETE FROM profiles WHERE id = ${sep.profile_id}`;
        await sql`DELETE FROM password_reset_tokens WHERE user_id = ${sep.user_id}`;
        await sql`DELETE FROM tasks WHERE assigned_to = ${sep.user_id}`;
        await sql`DELETE FROM users WHERE id = ${sep.user_id}`;
      }
    }
  } catch (e) { console.error('ucsbsep.org merge migration failed:', e); }

  // Ensure admin profile is always named "Admin Account" with no personal data
  await sql`
    INSERT INTO profiles (id, user_id, name, created_at, updated_at)
    SELECT ${nanoid()}, u.id, 'Admin Account', ${new Date().toISOString()}, ${new Date().toISOString()}
    FROM users u
    WHERE u.role = 'admin'
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = u.id)
  `;
  await sql`
    UPDATE profiles SET
      name = 'Admin Account', major = NULL, grad_year = NULL, hometown = NULL,
      birthday = NULL, bio = NULL, linkedin = NULL, instagram = NULL,
      phone = NULL, pledge_class = NULL, photo_url = NULL
    WHERE user_id IN (SELECT id FROM users WHERE role = 'admin')
  `;
}
