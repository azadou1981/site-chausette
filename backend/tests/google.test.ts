import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { openDb } from '../src/db.js';

const base = { JWT_SECRET: 'x'.repeat(32), NODE_ENV: 'test', BCRYPT_ROUNDS: '4', RATE_LIMIT_MAX: '1000', AUTH_RATE_LIMIT_MAX: '1000' };
const google = { GOOGLE_CLIENT_ID: 'cid', GOOGLE_CLIENT_SECRET: 'csecret' };
afterEach(() => vi.unstubAllGlobals());

function stubGoogle(info: object, tokenOk = true) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => String(url).includes('token')
    ? new Response(JSON.stringify({ access_token: 'at' }), { status: tokenOk ? 200 : 400 })
    : new Response(JSON.stringify(info))));
}
async function login(db = openDb(':memory:'), state = 'good') {
  const agent = request.agent(createApp(loadEnv({ ...base, ...google }), db));
  const start = await agent.get('/api/auth/google');
  const real = new URL(start.headers.location).searchParams.get('state');
  const cb = await agent.get('/api/auth/google/callback').query({ code: 'c', state: state === 'good' ? real : 'bad' });
  return { start, cb, agent, db };
}

describe('google oauth', () => {
  it('is 503 when not configured', async () => {
    const res = await request(createApp(loadEnv(base), openDb(':memory:'))).get('/api/auth/google');
    expect(res.status).toBe(503);
  });
  it('redirects to Google with a state, then creates a user and a session', async () => {
    stubGoogle({ sub: 'g1', email: 'Bob@Gmail.com', email_verified: true, name: 'Bob' });
    const { start, cb, agent } = await login();
    expect(start.status).toBe(302);
    expect(start.headers.location).toMatch(/^https:\/\/accounts\.google\.com\/.*client_id=cid/);
    expect(cb.status).toBe(302);
    expect(cb.headers.location).toBe('http://localhost:5173');
    const me = await agent.get('/api/auth/me');
    expect(me.body.user).toMatchObject({ email: 'bob@gmail.com', name: 'Bob', role: 'user' });
  });
  it('links an existing email account and never makes it admin', async () => {
    stubGoogle({ sub: 'g2', email: 'admin@unik.com', email_verified: true, name: 'X' });
    const db = openDb(':memory:');
    db.prepare("INSERT INTO users (name,email,password_hash,role) VALUES ('A','admin@unik.com','h','user')").run();
    const { agent } = await login(db);
    expect((await agent.get('/api/auth/me')).body.user.role).toBe('user');
    expect((db.prepare('SELECT google_id g FROM users').get() as { g: string }).g).toBe('g2');
  });
  it('rejects a wrong state, an unverified email and a failed token exchange', async () => {
    stubGoogle({ sub: 'g3', email: 'a@b.com', email_verified: true });
    expect((await login(undefined, 'bad')).cb.headers.location).toMatch(/error=google/);
    stubGoogle({ sub: 'g3', email: 'a@b.com', email_verified: false });
    expect((await login()).cb.headers.location).toMatch(/error=google/);
    stubGoogle({}, false);
    expect((await login()).cb.headers.location).toMatch(/error=google/);
  });
});
