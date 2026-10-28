import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { z } from 'zod';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { validateBody } from '../src/middleware/validate.js';

const base = { JWT_SECRET: 'x'.repeat(32), NODE_ENV: 'test', RATE_LIMIT_MAX: '1000', DB_PATH: ':memory:' };
const app = () => createApp(loadEnv(base));

describe('headers and CORS', () => {
  it('sets helmet and CSP headers', async () => {
    const res = await request(app()).get('/api/health');
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
  it('allows only the frontend origin', async () => {
    const ok = await request(app()).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    const bad = await request(app()).get('/api/health').set('Origin', 'http://evil.example');
    expect(bad.headers['access-control-allow-origin']).toBe('http://localhost:5173'); // never echoes the attacker
  });
});

describe('csrf', () => {
  it('rejects POST without or with a wrong token', async () => {
    const a = app();
    expect((await request(a).post('/api/anything')).status).toBe(403);
    const agent = request.agent(a);
    await agent.get('/api/csrf');
    expect((await agent.post('/api/anything').set('X-CSRF-Token', 'wrong')).status).toBe(403);
  });
  it('accepts POST with the matching token', async () => {
    const agent = request.agent(app());
    const { body } = await agent.get('/api/csrf');
    const res = await agent.post('/api/anything').set('X-CSRF-Token', body.csrfToken);
    expect(res.status).toBe(404); // passed CSRF, no such route
  });
});

describe('rate limit and env', () => {
  it('returns 429 past the limit', async () => {
    const a = createApp(loadEnv({ ...base, RATE_LIMIT_MAX: '3' }));
    const codes: number[] = [];
    for (let i = 0; i < 5; i++) codes.push((await request(a).get('/api/health')).status);
    expect(codes).toEqual([200, 200, 200, 429, 429]);
  });
  it('fails on a short JWT_SECRET', () => {
    expect(() => loadEnv({ ...base, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });
});

describe('validate', () => {
  it('returns 400 with details on invalid body', async () => {
    const a = express().use(express.json()).post('/t', validateBody(z.object({ n: z.number() })), (_q, r) => r.json({}));
    const res = await request(a).post('/t').send({ n: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
  });
});
