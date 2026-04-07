import { Router } from "express";

const router = Router();

// In-memory cache — 1 hour TTL
const cache = new Map<string, { url: string | null; ts: number }>();
const TTL = 60 * 60 * 1000;

// Social crawlers (e.g. Facebook, Slack) are whitelisted by LinkedIn to
// receive public og:image tags — so this UA gets the actual profile photo.
const UA =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

router.get("/linkedin-photo/:slug", async (req, res) => {
  const { slug } = req.params;
  if (!/^[\w\-\.]+$/.test(slug)) {
    res.json({ url: null });
    return;
  }

  const hit = cache.get(slug);
  if (hit && Date.now() - hit.ts < TTL) {
    res.json({ url: hit.url });
    return;
  }

  try {
    const response = await fetch(`https://www.linkedin.com/in/${slug}`, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });

    const html = await response.text();

    // og:image can appear in two attribute orderings
    const match =
      html.match(
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
      ) ||
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
      );

    const url = match ? match[1] : null;
    cache.set(slug, { url, ts: Date.now() });
    res.json({ url });
  } catch {
    cache.set(slug, { url: null, ts: Date.now() });
    res.json({ url: null });
  }
});

export default router;
