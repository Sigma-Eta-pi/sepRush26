import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
const mocks = vi.hoisted(() => ({ sql: vi.fn(), role: 'pledge' }));
vi.mock('../server/db.js', () => ({ sql: mocks.sql }));
vi.mock('../server/middleware/auth.js', () => {
  const auth = (req: any, res: any, next: any) => {
    if (mocks.role) req.user = { id: 'self', role: mocks.role };
    next();
  };
  return { optionalAuth: auth, requireAuth: auth };
});
import router from '../server/routes/profiles';
let server: Server, base: string;
beforeAll(async () => {
  const app = express();
  app.use(router);
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterAll(() => server.close());
beforeEach(() => {
  mocks.role = 'pledge';
  mocks.sql.mockReset().mockResolvedValue([{ id: 'profile', user_id: 'other', name: 'Member', phone: '555-0100', birthday: '01-01' }]);
});
it('pledge detail requests respect the same contact privacy as the directory', async () => {
  const other = await (await fetch(base + '/other')).json();
  expect(other.name).toBe('Member');
  expect(other).not.toHaveProperty('phone');
  expect(other).not.toHaveProperty('birthday');
  const own = await (await fetch(base + '/self')).json();
  expect(own.phone).toBe('555-0100');
});
it('public and authenticated lists and details exclude archived accounts in SQL', async () => {
  for (const role of ['', 'active']) {
    mocks.role = role;
    const data = await (await fetch(base + '/')).json();
    if (!role) expect(data[0]).not.toHaveProperty('phone');
  }
  await fetch(base + '/other');
  for (const [parts] of mocks.sql.mock.calls) {
    expect(parts.join('?')).toContain('COALESCE(e.archived,FALSE) = FALSE');
  }
});
it('archived or nonexistent profile details return 404 without data', async () => {
  mocks.sql.mockResolvedValue([]);
  const response = await fetch(base + '/removed');
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: 'Profile not found' });
});
