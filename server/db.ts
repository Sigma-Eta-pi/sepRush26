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
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'general',
      url TEXT NOT NULL,
      doc_type TEXT DEFAULT 'link',
      uploaded_by TEXT NOT NULL,
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
  await sql`
    CREATE TABLE IF NOT EXISTS site_content (
      id TEXT PRIMARY KEY,
      page TEXT UNIQUE NOT NULL,
      content_json TEXT NOT NULL,
      updated_by TEXT,
      updated_at TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_by TEXT,
      updated_at TEXT
    )
  `;

  // Separate LinkedIn photo column (never overwritten by user uploads)
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_photo_url TEXT`;
  // One-time migration: copy existing photo_url → linkedin_photo_url for profiles that have a linkedin URL
  await sql`UPDATE profiles SET linkedin_photo_url = photo_url WHERE linkedin_photo_url IS NULL AND photo_url IS NOT NULL AND linkedin IS NOT NULL AND linkedin != ''`;

  // Add source + gcal_uid columns to events table
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'`;
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS gcal_uid TEXT`;

  // Add first_login column if it doesn't exist — defaults to 1 so ALL existing users must change password
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login INTEGER NOT NULL DEFAULT 1`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_editor INTEGER NOT NULL DEFAULT 0`;
  // Migrate any existing role='editor' users: give them is_editor=1 and set base role to 'active'
  await sql`UPDATE users SET is_editor = 1 WHERE role = 'editor'`;
  await sql`UPDATE users SET role = 'active' WHERE role = 'editor'`;

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

  // Restore exec account to admin if accidentally changed
  await sql`UPDATE users SET role = 'admin' WHERE email = 'exec@ucsbsep.org' AND role != 'admin'`;

  // Fix any lowercase 'founder' pledge_class entries
  await sql`UPDATE profiles SET pledge_class = 'Founder' WHERE pledge_class = 'founder'`;

  // Clear broken LinkedIn CDN photo URLs — these expire and get hotlink-blocked by LinkedIn
  await sql`UPDATE profiles SET photo_url = NULL WHERE photo_url LIKE 'https://media.licdn.com%'`;

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

  // Migrate @ucsbsep.org accounts → correct @ucsb.edu emails (hardcoded from seed data)
  try {
    const NAME_TO_EMAIL: Record<string, string> = {
      'piam parekh':               'jparekh@ucsb.edu',
      'shiv dutta':                'shiv749@ucsb.edu',
      'kate heidenga':             'kheidenga@ucsb.edu',
      'huy nguyen':                'huy_nguyen@ucsb.edu',
      'sally hu':                  'shu971@ucsb.edu',
      'julia jimenea':             'juliajimenea@ucsb.edu',
      'saloni singhal':            'salonisinghal@ucsb.edu',
      'christina sfatcu':          'sfatcu@ucsb.edu',
      'vaibhava sri rajesh khanna':'vaibhavasri@ucsb.edu',
      'matthew vasquez':     'mrvasquez@ucsb.edu',
      'aaron ramirez':             'aaronramirez@ucsb.edu',
      'amaya bratcher':            'amayabratcher@ucsb.edu',
      'ariana tran':               'arianatran@ucsb.edu',
      'brooke namie bradley':      'bnbradley@ucsb.edu',
      'clay griffin':              'claygriffin@ucsb.edu',
      'daysi recinos':             'drecinos@ucsb.edu',
      'deepthy mukkara':           'deepthymukkara@ucsb.edu',
      'henry snow':                'hhs@ucsb.edu',
      'jack larson':               'jacklarson@umail.ucsb.edu',
      'jean kalaw':                'kalaw@ucsb.edu',
      'julio bermudez':            'juliobermudez@ucsb.edu',
      'kai abutin':                'kaiabutin@ucsb.edu',
      'katelyn nguyen':            'katelyntnguyen@ucsb.edu',
      'kyra chagarlamudi':         'kcamudi@ucsb.edu',
      'luke patterson':            'lukepatterson@ucsb.edu',
      'madigan escobar':           'madigan@ucsb.edu',
      'mariana franca pires':      'marianafrancapires@ucsb.edu',
      'mariana frança pires':      'marianafrancapires@ucsb.edu',
      'matthew chang':             'matthew_chang@ucsb.edu',
      'nina rossi':                'ninarossi@ucsb.edu',
      'nirvaan patel':             'nirvaan_patel@ucsb.edu',
      'noah de la rionda':         'noahdelarionda@ucsb.edu',
      'om kulkarni':               'om77@ucsb.edu',
      'preston chung':             'preston_chung@ucsb.edu',
      'raiyan khan':               'raiyan@ucsb.edu',
      'rohan kamdar':              'rohankamdar@ucsb.edu',
      'ryan nguyen':               'r_nguyen@ucsb.edu',
      'samrita sivakumar':         'smrita@ucsb.edu',
      'savannah rivera':           'savannah_rivera@ucsb.edu',
      'sudiksha kaushik':          'skaushik@ucsb.edu',
      'tyler pintor':              'tpintor@ucsb.edu',
    };

    const sepUsers = await sql`
      SELECT u.id AS user_id, u.email, p.id AS profile_id, p.name, p.photo_url, p.linkedin, p.pledge_class
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.email LIKE '%@ucsbsep.org' AND u.email != 'exec@ucsbsep.org'
    `;

    for (const sep of sepUsers) {
      const nameKey = (sep.name ?? '').toLowerCase().trim();
      const targetEmail = NAME_TO_EMAIL[nameKey];

      if (!targetEmail) {
        // No mapping found — delete orphan
        if (sep.profile_id) await sql`DELETE FROM profiles WHERE id = ${sep.profile_id}`;
        await sql`DELETE FROM password_reset_tokens WHERE user_id = ${sep.user_id}`;
        await sql`DELETE FROM users WHERE id = ${sep.user_id}`;
        continue;
      }

      // Check if a @ucsb.edu account already exists for this email
      const existing = await sql`
        SELECT u.id AS user_id, p.id AS profile_id, p.photo_url, p.linkedin
        FROM users u LEFT JOIN profiles p ON p.user_id = u.id
        WHERE u.email = ${targetEmail} LIMIT 1
      `;

      if (existing.length > 0) {
        // Merge: transfer photo/linkedin to existing @ucsb.edu account if missing
        if (existing[0].profile_id) {
          await sql`
            UPDATE profiles SET
              photo_url   = COALESCE(photo_url,  ${sep.photo_url  ?? null}),
              linkedin    = COALESCE(linkedin,   ${sep.linkedin   ?? null})
            WHERE id = ${existing[0].profile_id}
          `;
        }
        if (sep.profile_id) await sql`DELETE FROM profiles WHERE id = ${sep.profile_id}`;
        await sql`DELETE FROM password_reset_tokens WHERE user_id = ${sep.user_id}`;
        await sql`DELETE FROM tasks WHERE assigned_to = ${sep.user_id}`;
        await sql`DELETE FROM users WHERE id = ${sep.user_id}`;
      } else {
        // No existing @ucsb.edu account — update the email directly
        await sql`UPDATE users SET email = ${targetEmail} WHERE id = ${sep.user_id}`;
      }
    }
  } catch (e) { console.error('ucsbsep.org email migration failed:', e); }

  // Ensure the exec service account profile exists but has no personal data
  await sql`
    INSERT INTO profiles (id, user_id, name, created_at, updated_at)
    SELECT ${nanoid()}, u.id, 'Admin Account', ${new Date().toISOString()}, ${new Date().toISOString()}
    FROM users u
    WHERE u.email IN ('exec@ucsbsep.org', 'exec@ucsbsep.com')
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = u.id)
  `;
}
