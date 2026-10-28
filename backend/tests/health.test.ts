import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';

const base = { JWT_SECRET: 'x'.repeat(32), NODE_ENV: 'test', DB_PATH: ':memory:' };

describe('health', () => {
  it('returns 200', async () => {
    const res = await request(createApp(loadEnv(base))).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
  it('requires an explicit ADMIN_PASSWORD in production', () => {
    expect(() => loadEnv({ ...base, NODE_ENV: 'production' })).toThrow(/ADMIN_PASSWORD/);
  });
  it('rejects a short JWT_SECRET', () => {
    expect(() => loadEnv({ ...base, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });
});
