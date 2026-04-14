import { Router } from 'express';

const router = Router();

// In-memory cache — 1 hour TTL, stores base64 data URLs
const cache = new Map<string, { url: string | null; ts: number }>();
const TTL = 60 * 60 * 1000;

const UA = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';

router.get('/linkedin-photo/:slug', async (req, res) => {
  const { slug } = req.params;
  if (!/^[\w\-\.]+$/.test(slug)) { res.json({ url: null }); return; }

  const hit = cache.get(slug);
  if (hit && Date.now() - hit.ts < TTL) { res.json({ url: hit.url }); return; }

  try {
    // Step 1: scrape og:image URL from LinkedIn profile page
    const pageRes = await fetch(`https://www.linkedin.com/in/${slug}`, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });

    const html = await pageRes.text();
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    const imgUrl = match ? match[1] : null;
    if (!imgUrl) { cache.set(slug, { url: null, ts: Date.now() }); res.json({ url: null }); return; }

    // Step 2: download the image server-side (LinkedIn allows this with crawler UA)
    // and return as base64 so the browser never hits LinkedIn's CDN directly
    const imgRes = await fetch(imgUrl, {
      headers: { 'User-Agent': UA, 'Referer': 'https://www.linkedin.com/' },
      signal: AbortSignal.timeout(8000),
    });

    if (!imgRes.ok) { cache.set(slug, { url: null, ts: Date.now() }); res.json({ url: null }); return; }

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    cache.set(slug, { url: dataUrl, ts: Date.now() });
    res.json({ url: dataUrl });
  } catch {
    cache.set(slug, { url: null, ts: Date.now() });
    res.json({ url: null });
  }
});

export default router;
