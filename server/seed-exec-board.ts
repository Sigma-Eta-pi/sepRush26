/**
 * Seed exec board accounts.
 * Run with: pnpm seed:exec
 * Safe to re-run — skips existing emails.
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { sql } from './db.js';

const DEFAULT_PASSWORD = 'UCsep2025!';

const EXEC_BOARD = [
  { name: 'Piam Parekh',               email: 'jparekh@ucsb.edu',        role: 'exec', linkedin: 'https://www.linkedin.com/in/piamparekh/' },
  { name: 'Shiv Dutta',                email: 'shiv749@ucsb.edu',         role: 'exec', linkedin: 'https://www.linkedin.com/in/shiv-dutta/' },
  { name: 'Kate Heidenga',             email: 'kheidenga@ucsb.edu',       role: 'exec', linkedin: 'https://www.linkedin.com/in/kateheidenga/' },
  { name: 'Huy Nguyen',                email: 'huy_nguyen@ucsb.edu',      role: 'exec', linkedin: 'https://www.linkedin.com/in/huynguyen06/' },
  { name: 'Sally Hu',                  email: 'shu971@ucsb.edu',          role: 'exec', linkedin: 'https://www.linkedin.com/in/sally-huu/' },
  { name: 'Julia Jimenea',             email: 'juliajimenea@ucsb.edu',    role: 'exec', linkedin: 'https://www.linkedin.com/in/juliajimenea/' },
  { name: 'Saloni Singhal',            email: 'salonisinghal@ucsb.edu',   role: 'exec', linkedin: 'https://www.linkedin.com/in/ssaloni-singhal/' },
  { name: 'Christina Sfatcu',          email: 'sfatcu@ucsb.edu',          role: 'exec', linkedin: 'https://www.linkedin.com/in/christina-sfatcu/' },
  { name: 'Vaibhava Sri Rajesh Khanna',email: 'vaibhavasri@ucsb.edu',     role: 'exec', linkedin: '' },
  { name: 'Matthew Vasquez',     email: 'mrvasquez@ucsb.edu',       role: 'exec', linkedin: '' },
];

async function seed() {
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const now = new Date().toISOString();
  let created = 0;
  let skipped = 0;

  for (const member of EXEC_BOARD) {
    const email = member.email;
    const userId = nanoid();
    const profileId = nanoid();

    const result = await sql`
      INSERT INTO users (id, email, password_hash, role, created_at)
      VALUES (${userId}, ${email}, ${hash}, ${member.role}, ${now})
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;

    if (result.length === 0) {
      console.log(`⏭  Skipped (exists): ${member.name} <${email}>`);
      skipped++;
      continue;
    }

    await sql`
      INSERT INTO profiles (id, user_id, name, pledge_class, created_at, updated_at)
      VALUES (${profileId}, ${userId}, ${member.name}, 'Founder', ${now}, ${now})
      ON CONFLICT DO NOTHING
    `;

    console.log(`✓  Created: ${member.name} <${email}> [${member.role}]`);
    created++;
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped.`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
