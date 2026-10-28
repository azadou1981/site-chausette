import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadEnv } from '../src/config/env.js';
import { openDb } from '../src/db.js';
import { seed } from '../src/seed.js';

describe('seed', () => {
  it('creates the admin and 8 socks with images, idempotently', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-'));
    const env = loadEnv({ JWT_SECRET: 'x'.repeat(32), NODE_ENV: 'test', BCRYPT_ROUNDS: '4', UPLOAD_DIR: dir, ADMIN_EMAIL: 'boss@example.com' });
    const db = openDb(':memory:');
    const counts = () => [(db.prepare('SELECT COUNT(*) n FROM users').get() as { n: number }).n, (db.prepare('SELECT COUNT(*) n FROM socks').get() as { n: number }).n];
    seed(env, db);
    expect(counts()).toEqual([1, 8]);
    seed(env, db);
    expect(counts()).toEqual([1, 8]);
    expect((db.prepare("SELECT role FROM users WHERE email = 'boss@example.com'").get() as { role: string }).role).toBe('admin');
    expect(fs.readdirSync(dir)).toHaveLength(8);
  });
});
