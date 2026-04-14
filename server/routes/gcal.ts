import { Router } from 'express';
import { sql } from '../db.js';
import { nanoid } from 'nanoid';
import { requireAuth } from '../middleware/auth.js';
import ical from 'node-ical';

const router = Router();

// Get current settings + last sync info
router.get('/status', requireAuth, async (req, res) => {
  const user = (req as any).user;
  if (!['exec', 'admin'].includes(user?.role)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const rows = await sql`SELECT key, value FROM site_settings WHERE key IN ('gcal_ical_url', 'gcal_last_sync', 'gcal_last_count')`;
    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json({ icalUrl: settings.gcal_ical_url || '', lastSync: settings.gcal_last_sync || null, lastCount: settings.gcal_last_count || '0' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Save iCal URL
router.post('/settings', requireAuth, async (req, res) => {
  const user = (req as any).user;
  if (!['exec', 'admin'].includes(user?.role)) return res.status(403).json({ error: 'Forbidden' });
  const { icalUrl } = req.body;
  if (!icalUrl) return res.status(400).json({ error: 'icalUrl required' });
  try {
    await sql`INSERT INTO site_settings (key, value, updated_by, updated_at) VALUES ('gcal_ical_url', ${icalUrl}, ${user.id}, ${new Date().toISOString()}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at`;
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Sync events from iCal URL
router.post('/sync', requireAuth, async (req, res) => {
  const user = (req as any).user;
  if (!['exec', 'admin'].includes(user?.role)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const urlRow = await sql`SELECT value FROM site_settings WHERE key = 'gcal_ical_url'`;
    if (!urlRow.length) return res.status(400).json({ error: 'No iCal URL configured' });
    const icalUrl = urlRow[0].value;

    const data = await ical.async.fromURL(icalUrl);
    let imported = 0, updated = 0;

    for (const [, event] of Object.entries(data)) {
      if (!event || event.type !== 'VEVENT') continue;
      const uid = (event as any).uid as string;
      if (!uid) continue;

      const start: Date = (event as any).start;
      const summary: string = (event as any).summary || 'Untitled';
      const description: string = (event as any).description || '';
      const location: string = (event as any).location || '';

      if (!start) continue;

      const dateStr = start.toISOString().split('T')[0];
      const timeStr = start.toTimeString().substring(0, 5);

      const existing = await sql`SELECT id FROM events WHERE gcal_uid = ${uid} LIMIT 1`;
      if (existing.length > 0) {
        await sql`UPDATE events SET title = ${summary}, description = ${description}, location = ${location}, date = ${dateStr}, time = ${timeStr} WHERE gcal_uid = ${uid}`;
        updated++;
      } else {
        await sql`INSERT INTO events (id, title, description, date, time, location, type, created_by, created_at, source, gcal_uid) VALUES (${nanoid()}, ${summary}, ${description}, ${dateStr}, ${timeStr}, ${location}, 'general', ${user.id}, ${new Date().toISOString()}, 'gcal', ${uid})`;
        imported++;
      }
    }

    const total = imported + updated;
    await sql`INSERT INTO site_settings (key, value, updated_by, updated_at) VALUES ('gcal_last_sync', ${new Date().toISOString()}, ${user.id}, ${new Date().toISOString()}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at`;
    await sql`INSERT INTO site_settings (key, value, updated_by, updated_at) VALUES ('gcal_last_count', ${String(total)}, ${user.id}, ${new Date().toISOString()}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at`;

    res.json({ imported, updated, total });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
