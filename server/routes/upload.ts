import multer from 'multer';
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { requireAuth, requireEditor } from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP allowed'));
  },
});

const SITE_UPLOAD_DIR = path.resolve(process.cwd(), 'server', 'uploads', 'site');
if (!fs.existsSync(SITE_UPLOAD_DIR)) fs.mkdirSync(SITE_UPLOAD_DIR, { recursive: true });

const upload_disk = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, SITE_UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `site-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP, GIF allowed'));
  },
});

const router = Router();

router.post('/photo', requireAuth, upload.single('photo'), (req, res) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const b64 = req.file.buffer.toString('base64');
  const url = `data:${req.file.mimetype};base64,${b64}`;
  res.json({ url });
});

router.post('/site-image', requireEditor, upload_disk.single('image'), (req, res) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  res.json({ url: `/uploads/site/${req.file.filename}` });
});

export default router;
