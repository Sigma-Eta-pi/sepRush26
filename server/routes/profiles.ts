import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function trimStr(val: unknown, maxLen: number): string | undefined {
  if (typeof val !== 'string') return undefined;
  return val.trim().slice(0, maxLen);
}

// GET /api/profiles
router.get('/', requireAuth, (_req, res) => {
  res.json(db.data.profiles);
});

// GET /api/profiles/:userId
router.get('/:userId', requireAuth, (req, res) => {
  const profile = db.data.profiles.find(p => p.userId === req.params.userId);
  if (!profile) { res.status(404).json({ error: 'Profile not found' }); return; }
  res.json(profile);
});

// POST /api/profiles (upsert by userId)
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
  const { gradYear } = req.body;
  const existing = db.data.profiles.find(p => p.userId === req.user!.id);
  const now = new Date().toISOString();

  if (existing) {
    if (name !== undefined) existing.name = name;
    if (major !== undefined) existing.major = major;
    if (gradYear !== undefined) existing.gradYear = gradYear;
    if (hometown !== undefined) existing.hometown = hometown;
    if (birthday !== undefined) existing.birthday = birthday;
    if (bio !== undefined) existing.bio = bio;
    if (linkedin !== undefined) existing.linkedin = linkedin;
    if (instagram !== undefined) existing.instagram = instagram;
    if (phone !== undefined) existing.phone = phone;
    if (pledgeClass !== undefined) existing.pledgeClass = pledgeClass;
    existing.updatedAt = now;
    await db.write();
    res.json(existing);
  } else {
    const profile = {
      id: nanoid(),
      userId: req.user!.id,
      name: name || '',
      major, gradYear, hometown, birthday, bio, linkedin, instagram, phone, pledgeClass,
      createdAt: now,
      updatedAt: now,
    };
    db.data.profiles.push(profile);
    await db.write();
    res.json(profile);
  }
});

// PUT /api/profiles/:id
router.put('/:id', requireAuth, async (req, res) => {
  const profile = db.data.profiles.find(p => p.id === req.params.id);
  if (!profile) { res.status(404).json({ error: 'Profile not found' }); return; }

  if (profile.userId !== req.user!.id && req.user!.role !== 'admin') {
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
  const { gradYear } = req.body;
  if (name !== undefined) profile.name = name;
  if (major !== undefined) profile.major = major;
  if (gradYear !== undefined) profile.gradYear = gradYear;
  if (hometown !== undefined) profile.hometown = hometown;
  if (birthday !== undefined) profile.birthday = birthday;
  if (bio !== undefined) profile.bio = bio;
  if (linkedin !== undefined) profile.linkedin = linkedin;
  if (instagram !== undefined) profile.instagram = instagram;
  if (phone !== undefined) profile.phone = phone;
  if (pledgeClass !== undefined) profile.pledgeClass = pledgeClass;
  if (photoUrl !== undefined) profile.photoUrl = photoUrl;
  profile.updatedAt = new Date().toISOString();
  await db.write();

  res.json(profile);
});

export default router;
