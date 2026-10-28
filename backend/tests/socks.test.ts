import { describe, it, expect } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { openDb, insertUser } from '../src/db.js';

// 1x1 PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const fields = { title: 'Red socks', description: 'Warm and red', priceCents: '1200', stock: '5' };

async function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'up-'));
  const env = loadEnv({ JWT_SECRET: 'x'.repeat(32), NODE_ENV: 'test', RATE_LIMIT_MAX: '1000', AUTH_RATE_LIMIT_MAX: '1000', BCRYPT_ROUNDS: '4', UPLOAD_DIR: dir });
  const db = openDb(':memory:');
  insertUser(db, { name: 'Admin', email: 'admin@example.com', passwordHash: bcrypt.hashSync('adminpass1', 4), role: 'admin' });
  const app = createApp(env, db);
  const login = async (email: string, password: string) => {
    const a = request.agent(app);
    const { body } = await a.get('/api/csrf');
    const t = body.csrfToken as string;
    if (email) await a.post('/api/auth/login').set('X-CSRF-Token', t).send({ email, password });
    return { a, t };
  };
  const admin = await login('admin@example.com', 'adminpass1');
  const create = (c = admin, f: Record<string, string> = fields, img: Buffer | null = PNG, name = 'a.png', type = 'image/png') => {
    let r = c.a.post('/api/socks').set('X-CSRF-Token', c.t);
    for (const [k, v] of Object.entries(f)) r = r.field(k, v);
    return img ? r.attach('image', img, { filename: name, contentType: type }) : r;
  };
  return { app, dir, admin, login, create };
}

describe('socks', () => {
  it('admin creates with image, public lists/gets, update, delete removes the file', async () => {
    const { app, dir, admin, create } = await setup();
    const res = await create();
    expect(res.status).toBe(201);
    expect(res.body.imageUrl).toMatch(/^\/uploads\/[0-9a-f]{32}\.png$/);
    expect(res.body.priceCents).toBe(1200);
    const file = path.join(dir, res.body.imageUrl.split('/').pop());
    expect(fs.existsSync(file)).toBe(true);
    const img = await request(app).get(res.body.imageUrl);
    expect(img.status).toBe(200);
    expect(img.headers['x-content-type-options']).toBe('nosniff');
    expect((await request(app).get('/api/socks')).body.total).toBe(1);
    expect((await request(app).get(`/api/socks/${res.body.id}`)).body.title).toBe('Red socks');
    const up = await admin.a.put(`/api/socks/${res.body.id}`).set('X-CSRF-Token', admin.t).field({ ...fields, title: 'Blue socks' });
    expect(up.body.title).toBe('Blue socks');
    expect(up.body.imageUrl).toBe(res.body.imageUrl);
    expect((await admin.a.delete(`/api/socks/${res.body.id}`).set('X-CSRF-Token', admin.t)).status).toBe(204);
    expect(fs.existsSync(file)).toBe(false);
    expect((await request(app).get(`/api/socks/${res.body.id}`)).status).toBe(404);
  });
  it('strips HTML from title', async () => {
    const { create } = await setup();
    const res = await create(undefined, { ...fields, title: '<script>alert(1)</script>Socks' });
    expect(res.body.title).toBe('alert(1)Socks');
  });
  it('anonymous gets 401, normal user 403 on write', async () => {
    const { login, create } = await setup();
    expect((await create(await login('', ''))).status).toBe(401);
    const u = await login('', '');
    await u.a.post('/api/auth/register').set('X-CSRF-Token', u.t).send({ name: 'U', email: 'u@example.com', password: 'password1' });
    expect((await create(u)).status).toBe(403);
    expect((await u.a.delete('/api/socks/1').set('X-CSRF-Token', u.t)).status).toBe(403);
  });
  it('rejects non-images, fake images, oversize files and missing image', async () => {
    const { create, dir } = await setup();
    expect((await create(undefined, fields, Buffer.from('<svg/>'), 'a.svg', 'image/svg+xml')).status).toBe(400);
    expect((await create(undefined, fields, Buffer.from('not a png at all'), 'a.png', 'image/png')).status).toBe(400);
    expect((await create(undefined, fields, Buffer.alloc(3 * 1024 * 1024, 1), 'a.png', 'image/png')).status).toBe(413);
    expect((await create(undefined, fields, null)).status).toBe(400);
    expect((await create(undefined, { ...fields, priceCents: '-1' })).status).toBe(400);
    expect(fs.readdirSync(dir)).toEqual([]);
  });
  it('searches with q and paginates', async () => {
    const { app, create } = await setup();
    for (let i = 0; i < 13; i++) await create(undefined, { ...fields, title: i === 0 ? 'Striped 100%' : `Plain ${i}` });
    const p1 = (await request(app).get('/api/socks')).body;
    expect([p1.items.length, p1.total, p1.page]).toEqual([12, 13, 1]);
    expect((await request(app).get('/api/socks?page=2')).body.items.length).toBe(1);
    expect((await request(app).get('/api/socks?q=striped')).body.total).toBe(1);
    expect((await request(app).get('/api/socks?q=%25')).body.total).toBe(1); // % is literal, not a wildcard
  });
});
