import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { loadEnv } from '../src/config/env.js';
import { openDb } from '../src/db.js';
import { seedTestAdmin } from '../src/seedTestAdmin.js';
import { createApp } from '../src/app.js';

const base = { JWT_SECRET: 'x'.repeat(32), BCRYPT_ROUNDS: '4', RATE_LIMIT_MAX: '1000', AUTH_RATE_LIMIT_MAX: '1000' };

describe('seedTestAdmin', () => {
  it('creates admin@unik.com idempotently and it can log in as admin', async () => {
    const env = loadEnv({ ...base, NODE_ENV: 'test' });
    const db = openDb(':memory:');
    seedTestAdmin(env, db);
    seedTestAdmin(env, db);
    expect((db.prepare("SELECT COUNT(*) n FROM users WHERE email = 'admin@unik.com'").get() as { n: number }).n).toBe(1);
    const agent = request.agent(createApp(env, db));
    const { body } = await agent.get('/api/csrf');
    const res = await agent.post('/api/auth/login').set('X-CSRF-Token', body.csrfToken).send({ email: 'admin@unik.com', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
  });
  it('refuses to run in production', () => {
    const env = loadEnv({ ...base, NODE_ENV: 'production', ADMIN_PASSWORD: 'a-real-password' });
    expect(() => seedTestAdmin(env, openDb(':memory:'))).toThrow(/production/);
  });
});
