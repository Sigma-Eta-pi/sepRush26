/**
 * Seed founder class accounts.
 * Run with: pnpm seed:founding
 * Safe to re-run — skips existing emails.
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { sql } from "./db.js";

const DEFAULT_PASSWORD = "UCsep2025!";

const MEMBERS = [
  { name: "Aaron Ramirez", email: "aaronramirez@ucsb.edu" },
  { name: "Amaya Bratcher", email: "amayabratcher@ucsb.edu" },
  { name: "Ariana Tran", email: "arianatran@ucsb.edu" },
  { name: "Brooke Namie Bradley", email: "bnbradley@ucsb.edu" },
  { name: "Clay Griffin", email: "claygriffin@ucsb.edu" },
  { name: "Daysi Recinos", email: "drecinos@ucsb.edu" },
  { name: "Deepthy Mukkara", email: "deepthymukkara@ucsb.edu" },
  { name: "Henry Snow", email: "hhs@ucsb.edu" },
  { name: "Jack Larson", email: "jacklarson@umail.ucsb.edu" },
  { name: "Jean Kalaw", email: "kalaw@ucsb.edu" },
  { name: "Julio Bermudez", email: "juliobermudez@ucsb.edu" },
  { name: "Kai Abutin", email: "kaiabutin@ucsb.edu" },
  { name: "Katelyn Nguyen", email: "katelyntnguyen@ucsb.edu" },
  { name: "Kyra Chagarlamudi", email: "kcamudi@ucsb.edu" },
  { name: "Luke Patterson", email: "lukepatterson@ucsb.edu" },
  { name: "Madigan Escobar", email: "madigan@ucsb.edu" },
  { name: "Mariana França Pires", email: "marianafrancapires@ucsb.edu" },
  { name: "Matthew Chang", email: "matthew_chang@ucsb.edu" },
  { name: "Matthew Vasquez", email: "mrvasquez@ucsb.edu" },
  { name: "Nina Rossi", email: "ninarossi@ucsb.edu" },
  { name: "Nirvaan Patel", email: "nirvaan_patel@ucsb.edu" },
  { name: "Noah de la Rionda", email: "noahdelarionda@ucsb.edu" },
  { name: "Om Kulkarni", email: "om77@ucsb.edu" },
  { name: "Preston Chung", email: "preston_chung@ucsb.edu" },
  { name: "Raiyan Khan", email: "raiyan@ucsb.edu" },
  { name: "Rohan Kamdar", email: "rohankamdar@ucsb.edu" },
  { name: "Ryan Nguyen", email: "r_nguyen@ucsb.edu" },
  { name: "Samrita Sivakumar", email: "smrita@ucsb.edu" },
  { name: "Savannah Rivera", email: "savannah_rivera@ucsb.edu" },
  { name: "Sudiksha Kaushik", email: "skaushik@ucsb.edu" },
  { name: "Tyler Pintor", email: "tpintor@ucsb.edu" },
  { name: "Vaibhava Sri Rajesh Khanna", email: "vaibhavasri@ucsb.edu" },
];

async function seed() {
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const now = new Date().toISOString();
  let created = 0;
  let skipped = 0;

  for (const member of MEMBERS) {
    const userId = nanoid();
    const profileId = nanoid();

    const result = await sql`
      INSERT INTO users (id, email, password_hash, role, created_at)
      VALUES (${userId}, ${member.email}, ${hash}, 'member', ${now})
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;

    if (result.length === 0) {
      console.log(`⏭  Skipped (exists): ${member.name} <${member.email}>`);
      skipped++;
      continue;
    }

    await sql`
      INSERT INTO profiles (id, user_id, name, pledge_class, created_at, updated_at)
      VALUES (${profileId}, ${userId}, ${member.name}, 'Founder', ${now}, ${now})
      ON CONFLICT DO NOTHING
    `;

    console.log(`✓  Created: ${member.name} <${member.email}>`);
    created++;
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped.`);
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
