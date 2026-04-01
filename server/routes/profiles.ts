import { Router } from 'express';
import { nanoid } from 'nanoid';
import { sql } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function trimStr(val: unknown, maxLen: number): string | undefined {
  if (typeof val !== 'string') return undefined;
  return val.trim().slice(0, maxLen);
}

function rowToProfile(r: any) {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name || '',
    major: r.major,
    gradYear: r.grad_year,
    hometown: r.hometown,
    birthday: r.birthday,
    bio: r.bio,
    linkedin: r.linkedin,
    instagram: r.instagram,
    phone: r.phone,
    pledgeClass: r.pledge_class,
    photoUrl: r.photo_url,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

router.get('/', requireAuth, async (_req, res) => {
  const rows = await sql`SELECT * FROM profiles`;
  res.json(rows.map(rowToProfile));
});

router.get('/:userId', requireAuth, async (req, res) => {
  const rows = await sql`SELECT * FROM profiles WHERE user_id = ${req.params.userId} LIMIT 1`;
  if (rows.length === 0) { res.status(404).json({ error: 'Profile not found' }); return; }
  res.json(rowToProfile(rows[0]));
});

router.post('/', requireAuth, async (req, res) => {
  const name = trimStr(req.body.name, 100);
  const major = trimStr(req.body.major, 100);
  const hometown = trimStr(req.body.hometown, 100);
  const birthday = trimStr(req.body.birthday, 20);
  const bio = trimStr(req.body.bio, 500);
  const linkedin = trimStr(req.body.linkedin, 200);
  const instagram = trimStr(req.body.instagram, 100);
  const phone = trimStr(req.body.phone, 20);
  const pledgeClass = trimStr(req.body.pledgeClass, 50);
  const gradYear = req.body.gradYear ?? null;
  const userId = req.user!.id;
  const now = new Date().toISOString();

  const existing = await sql`SELECT * FROM profiles WHERE user_id = ${userId} LIMIT 1`;

  if (existing.length > 0) {
    const p = existing[0];
    await sql`
      UPDATE profiles SET
        name = ${name ?? p.name},
        major = ${major ?? p.major},
        grad_year = ${gradYear ?? p.grad_year},
        hometown = ${hometown ?? p.hometown},
        birthday = ${birthday ?? p.birthday},
        bio = ${bio ?? p.bio},
        linkedin = ${linkedin ?? p.linkedin},
        instagram = ${instagram ?? p.instagram},
        phone = ${phone ?? p.phone},
        pledge_class = ${pledgeClass ?? p.pledge_class},
        updated_at = ${now}
      WHERE user_id = ${userId}
    `;
    const updated = await sql`SELECT * FROM profiles WHERE user_id = ${userId} LIMIT 1`;
    res.json(rowToProfile(updated[0]));
  } else {
    const id = nanoid();
    await sql`
      INSERT INTO profiles (id, user_id, name, major, grad_year, hometown, birthday, bio, linkedin, instagram, phone, pledge_class, created_at, updated_at)
      VALUES (${id}, ${userId}, ${name || ''}, ${major ?? null}, ${gradYear}, ${hometown ?? null}, ${birthday ?? null}, ${bio ?? null}, ${linkedin ?? null}, ${instagram ?? null}, ${phone ?? null}, ${pledgeClass ?? null}, ${now}, ${now})
    `;
    const inserted = await sql`SELECT * FROM profiles WHERE id = ${id} LIMIT 1`;
    res.json(rowToProfile(inserted[0]));
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const rows = await sql`SELECT * FROM profiles WHERE id = ${req.params.id} LIMIT 1`;
  if (rows.length === 0) { res.status(404).json({ error: 'Profile not found' }); return; }
  const p = rows[0];

  if (p.user_id !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  const name = trimStr(req.body.name, 100);
  const major = trimStr(req.body.major, 100);
  const hometown = trimStr(req.body.hometown, 100);
  const birthday = trimStr(req.body.birthday, 20);
  const bio = trimStr(req.body.bio, 500);
  const linkedin = trimStr(req.body.linkedin, 200);
  const instagram = trimStr(req.body.instagram, 100);
  const phone = trimStr(req.body.phone, 20);
  const pledgeClass = trimStr(req.body.pledgeClass, 50);
  const photoUrl = trimStr(req.body.photoUrl, 500);
  const gradYear = req.body.gradYear;
  const now = new Date().toISOString();

  await sql`
    UPDATE profiles SET
      name = ${name ?? p.name},
      major = ${major ?? p.major},
      grad_year = ${gradYear ?? p.grad_year},
      hometown = ${hometown ?? p.hometown},
      birthday = ${birthday ?? p.birthday},
      bio = ${bio ?? p.bio},
      linkedin = ${linkedin ?? p.linkedin},
      instagram = ${instagram ?? p.instagram},
      phone = ${phone ?? p.phone},
      pledge_class = ${pledgeClass ?? p.pledge_class},
      photo_url = ${photoUrl ?? p.photo_url},
      updated_at = ${now}
    WHERE id = ${req.params.id}
  `;
  const updated = await sql`SELECT * FROM profiles WHERE id = ${req.params.id} LIMIT 1`;
  res.json(rowToProfile(updated[0]));
});

export default router;
