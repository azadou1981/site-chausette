import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import type { Env } from './config/env.js';
import { findUserByEmail, insertUser, type Db } from './db.js';

export const TEST_ADMIN = { name: 'Admin', email: 'admin@unik.com', password: 'admin123' };

// Well-known credentials: development/test only. Idempotent; an existing user is promoted to admin.
export function seedTestAdmin(env: Env, db: Db) {
  if (env.NODE_ENV === 'production') throw new Error('Refusing to create the test admin (admin@unik.com) in production');
  const passwordHash = bcrypt.hashSync(TEST_ADMIN.password, env.BCRYPT_ROUNDS);
  if (findUserByEmail(db, TEST_ADMIN.email)) {
    db.prepare("UPDATE users SET role = 'admin', password_hash = ? WHERE email = ?").run(passwordHash, TEST_ADMIN.email);
  } else {
    insertUser(db, { name: TEST_ADMIN.name, email: TEST_ADMIN.email, passwordHash, role: 'admin' });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { loadEnv } = await import('./config/env.js');
  const { openDb } = await import('./db.js');
  const env = loadEnv();
  seedTestAdmin(env, openDb(env.DB_PATH));
  console.log(`Test admin ready: ${TEST_ADMIN.email} / ${TEST_ADMIN.password}`);
}
