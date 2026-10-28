import { describe, it, expect } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { openDb, insertUser } from '../src/db.js';

const env = loadEnv({ JWT_SECRET: 'x'.repeat(32), NODE_ENV: 'test', RATE_LIMIT_MAX: '1000', AUTH_RATE_LIMIT_MAX: '1000', BCRYPT_ROUNDS: '4', DB_PATH: ':memory:' });

// Test helper: app + agent holding a CSRF token, plus an admin user already in the DB.
export async function setup() {
  const db = openDb(':memory:');
  insertUser(db, { name: 'Admin', email: 'admin@example.com', passwordHash: bcrypt.hashSync('adminpass1', 4), role: 'admin' });
  const agent = request.agent(createApp(env, db));
  const { body } = await agent.get('/api/csrf');
  const post = (url: string, data: object) => agent.post(url).set('X-CSRF-Token', body.csrfToken).send(data);
  return { agent, post };
}
const user = { name: 'Alice', email: 'Alice@Example.com', password: 'secret123' };

describe('auth', () => {
  it('registers, hashes the password, sets an httpOnly cookie, hides the hash', async () => {
    const { post, agent } = await setup();
    const res = await post('/api/auth/register', user);
    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({ id: expect.any(Number), name: 'Alice', email: 'alice@example.com', role: 'user' });
    expect(JSON.stringify(res.body)).not.toMatch(/hash|secret123/);
    const cookie = String((res.headers['set-cookie'] as unknown as string[]).find((c: string) => c.startsWith('token=')));
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect((await agent.get('/api/auth/me')).body.user.email).toBe('alice@example.com');
  });
  it('stores a bcrypt hash', async () => {
    const db = openDb(':memory:');
    const agent = request.agent(createApp(env, db));
    const { body } = await agent.get('/api/csrf');
    await agent.post('/api/auth/register').set('X-CSRF-Token', body.csrfToken).send(user);
    const row = db.prepare('SELECT password_hash FROM users WHERE email = ?').get('alice@example.com') as { password_hash: string };
    expect(row.password_hash).toMatch(/^\$2[aby]\$/);
    expect(bcrypt.compareSync('secret123', row.password_hash)).toBe(true);
  });
  it('rejects duplicate email with 409 and bad input with 400', async () => {
    const { post } = await setup();
    await post('/api/auth/register', user);
    expect((await post('/api/auth/register', user)).status).toBe(409);
    expect((await post('/api/auth/register', { ...user, email: 'nope' })).status).toBe(400);
    expect((await post('/api/auth/register', { ...user, email: 'b@example.com', password: 'short' })).status).toBe(400);
  });
  it('strips HTML from the name', async () => {
    const { post } = await setup();
    const res = await post('/api/auth/register', { ...user, name: '<script>alert(1)</script>Bob' });
    expect(res.body.user.name).not.toMatch(/[<>]/);
    expect(res.body.user.name).toContain('Bob');
  });
  it('logs in, rejects bad credentials, logs out', async () => {
    const { post, agent } = await setup();
    await post('/api/auth/register', user);
    await post('/api/auth/logout', {});
    expect((await agent.get('/api/auth/me')).status).toBe(401);
    expect((await post('/api/auth/login', { email: user.email, password: 'wrongpass1' })).status).toBe(401);
    expect((await post('/api/auth/login', { email: 'ghost@example.com', password: 'wrongpass1' })).status).toBe(401);
    expect((await post('/api/auth/login', { email: user.email, password: user.password })).status).toBe(200);
    expect((await agent.get('/api/auth/me')).status).toBe(200);
  });
  it('lets the seeded admin log in with role admin', async () => {
    const { post } = await setup();
    const res = await post('/api/auth/login', { email: 'admin@example.com', password: 'adminpass1' });
    expect(res.body.user.role).toBe('admin');
  });
  it('requires auth for /me', async () => {
    const { agent } = await setup();
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});
