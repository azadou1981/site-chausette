import { describe, it, expect } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { openDb, insertUser } from '../src/db.js';

const env = loadEnv({ JWT_SECRET: 'x'.repeat(32), NODE_ENV: 'test', RATE_LIMIT_MAX: '1000', AUTH_RATE_LIMIT_MAX: '1000', BCRYPT_ROUNDS: '4', DB_PATH: ':memory:' });

async function setup() {
  const db = openDb(':memory:');
  insertUser(db, { name: 'Admin', email: 'admin@example.com', passwordHash: bcrypt.hashSync('adminpass1', 4), role: 'admin' });
  db.prepare("INSERT INTO socks (title, description, price_cents, stock) VALUES ('Red', 'd', 1000, 5), ('Blue', 'd', 250, 1)").run();
  const app = createApp(env, db);
  const client = async (login?: { email: string; password: string }) => {
    const a = request.agent(app);
    const { body } = await a.get('/api/csrf');
    const post = (u: string, d: object) => a.post(u).set('X-CSRF-Token', body.csrfToken).send(d);
    if (login) await post('/api/auth/login', login);
    return { a, post };
  };
  const user = await client();
  await user.post('/api/auth/register', { name: 'Al', email: 'al@example.com', password: 'password1' });
  return { db, client, user, admin: await client({ email: 'admin@example.com', password: 'adminpass1' }), anon: await client() };
}

describe('orders', () => {
  it('computes the total server-side, merges lines, decrements stock', async () => {
    const { user, db } = await setup();
    const res = await user.post('/api/orders', { items: [{ sockId: 1, qty: 2 }, { sockId: 1, qty: 1 }, { sockId: 2, qty: 1 }], totalCents: 1 });
    expect(res.status).toBe(201);
    expect(res.body.totalCents).toBe(3250);
    expect(res.body.items).toHaveLength(2);
    expect((db.prepare('SELECT stock FROM socks WHERE id = 1').get() as { stock: number }).stock).toBe(2);
    expect((await user.a.get('/api/orders')).body.items).toHaveLength(1);
  });
  it('rejects insufficient stock atomically, unknown socks and bad input', async () => {
    const { user, db } = await setup();
    expect((await user.post('/api/orders', { items: [{ sockId: 1, qty: 1 }, { sockId: 2, qty: 2 }] })).status).toBe(409);
    expect((db.prepare('SELECT stock FROM socks WHERE id = 1').get() as { stock: number }).stock).toBe(5);
    expect((await user.post('/api/orders', { items: [{ sockId: 99, qty: 1 }] })).status).toBe(400);
    expect((await user.post('/api/orders', { items: [] })).status).toBe(400);
    expect((await user.post('/api/orders', { items: [{ sockId: 1, qty: 0 }] })).status).toBe(400);
  });
  it('requires auth to order; history is per user', async () => {
    const { anon, user, client } = await setup();
    expect((await anon.post('/api/orders', { items: [{ sockId: 1, qty: 1 }] })).status).toBe(401);
    await user.post('/api/orders', { items: [{ sockId: 1, qty: 1 }] });
    const other = await client();
    await other.post('/api/auth/register', { name: 'Bo', email: 'bo@example.com', password: 'password1' });
    expect((await other.a.get('/api/orders')).body.items).toHaveLength(0);
  });
  it('GET /admin/orders: 401 anonymous, 403 user, 200 admin', async () => {
    const { anon, user, admin } = await setup();
    await user.post('/api/orders', { items: [{ sockId: 1, qty: 1 }] });
    expect((await anon.a.get('/api/admin/orders')).status).toBe(401);
    expect((await user.a.get('/api/admin/orders')).status).toBe(403);
    const res = await admin.a.get('/api/admin/orders');
    expect(res.status).toBe(200);
    expect(res.body.items[0].user.email).toBe('al@example.com');
    expect(JSON.stringify(res.body)).not.toMatch(/hash/);
  });
});
