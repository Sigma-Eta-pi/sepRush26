import { Router } from 'express';
import { nanoid } from 'nanoid';
import Anthropic from '@anthropic-ai/sdk';
import { sql } from '../db.js';
import { requireEditor } from '../middleware/auth.js';

const router = Router();

const ALLOWED_PAGES = ['home', 'about', 'careers', 'recruitment'] as const;
type AllowedPage = typeof ALLOWED_PAGES[number];

function isAllowedPage(p: string): p is AllowedPage {
  return (ALLOWED_PAGES as readonly string[]).includes(p);
}

// GET /api/content/:page — public
router.get('/:page', async (req, res) => {
  const { page } = req.params;
  if (!isAllowedPage(page)) {
    res.status(400).json({ error: 'Invalid page' });
    return;
  }
  const rows = await sql`SELECT content_json FROM site_content WHERE page = ${page}`;
  if (rows.length === 0) {
    res.json({});
    return;
  }
  try {
    res.json(JSON.parse(rows[0].content_json as string));
  } catch {
    res.json({});
  }
});

// PUT /api/content/:page — editor/admin only
router.put('/:page', requireEditor, async (req, res) => {
  const { page } = req.params;
  if (!isAllowedPage(page)) {
    res.status(400).json({ error: 'Invalid page' });
    return;
  }
  const content = req.body;
  const contentJson = JSON.stringify(content);
  // SECURITY: reject oversized payloads to prevent DB bloat / DoS
  if (contentJson.length > 500_000) {
    res.status(413).json({ error: 'Content payload too large (max 500 KB)' });
    return;
  }
  const now = new Date().toISOString();
  const updatedBy = req.user!.id;

  const existing = await sql`SELECT id FROM site_content WHERE page = ${page}`;
  if (existing.length === 0) {
    const id = nanoid();
    await sql`
      INSERT INTO site_content (id, page, content_json, updated_by, updated_at)
      VALUES (${id}, ${page}, ${contentJson}, ${updatedBy}, ${now})
    `;
  } else {
    await sql`
      UPDATE site_content
      SET content_json = ${contentJson}, updated_by = ${updatedBy}, updated_at = ${now}
      WHERE page = ${page}
    `;
  }
  res.json({ ok: true });
});

// POST /api/content/ai-chat — editor/admin only
router.post('/ai-chat', requireEditor, async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'AI not configured' });
    return;
  }

  const { page, currentContent, message, history } = req.body as {
    page: string;
    currentContent: unknown;
    message: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  };

  if (!isAllowedPage(page)) {
    res.status(400).json({ error: 'Invalid page' });
    return;
  }

  // SECURITY: cap message size and history depth to prevent token-burn abuse
  if (typeof message !== 'string' || message.length > 4_000) {
    res.status(400).json({ error: 'Message too long (max 4000 chars)' });
    return;
  }
  if (Array.isArray(history) && history.length > 20) {
    res.status(400).json({ error: 'History too long (max 20 turns)' });
    return;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt =
    `You edit the UCSB SEP website's ${page} page. The user will ask for changes to the page content. ` +
    `Respond ONLY with JSON in this exact format: { "explanation": string, "content": {...full updated content...} }. ` +
    `No other text, no markdown code blocks, just raw JSON.`;

  const priorMessages: Array<{ role: 'user' | 'assistant'; content: string }> = history ?? [];

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...priorMessages,
    {
      role: 'user',
      content: `Current content:\n${JSON.stringify(currentContent, null, 2)}\n\nRequest: ${message}`,
    },
  ];

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  });

  const rawText = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');

  try {
    const parsed = JSON.parse(rawText) as { explanation: string; content: unknown };
    res.json({ explanation: parsed.explanation, content: parsed.content });
  } catch {
    res.json({ explanation: rawText, content: null });
  }
});

export default router;
