import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import type { Env } from './config/env.js';
import { findUserByEmail, insertUser, type Db } from './db.js';

const IMAGES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'seed-images');

const DEMO = [
  ['red-stripes', 'Red stripe socks', 'Classic cotton socks with bold red and white stripes.', 1290, 40],
  ['navy-dots', 'Navy polka dot socks', 'Deep blue socks with cream polka dots, soft and breathable.', 1390, 35],
  ['forest-plain', 'Forest green socks', 'Plain forest green wool blend with a golden sole.', 1190, 50],
  ['mustard-stripes', 'Mustard stripe socks', 'Warm mustard and brown stripes for grey days.', 1290, 25],
  ['pink-dots', 'Pink dot socks', 'Playful pink socks with white dots.', 1090, 30],
  ['grey-plain', 'Everyday grey socks', 'Understated grey socks with a red sole detail.', 990, 60],
  ['sky-stripes', 'Sky blue stripe socks', 'Light and airy sky blue stripes.', 1190, 45],
  ['plum-dots', 'Plum dot socks', 'Rich plum socks with pale pink dots.', 1490, 20],
] as const;

// Idempotent: the admin is created if missing, demo socks are matched by title.
export function seed(env: Env, db: Db) {
  if (!findUserByEmail(db, env.ADMIN_EMAIL.toLowerCase())) {
    insertUser(db, { name: 'Admin', email: env.ADMIN_EMAIL.toLowerCase(), passwordHash: bcrypt.hashSync(env.ADMIN_PASSWORD, env.BCRYPT_ROUNDS), role: 'admin' });
  }
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
  for (const [key, title, description, price, stock] of DEMO) {
    if (db.prepare('SELECT 1 FROM socks WHERE title = ?').get(title)) continue;
    const image = `seed-${key}.png`;
    fs.copyFileSync(path.join(IMAGES, `${key}.png`), path.join(env.UPLOAD_DIR, image));
    db.prepare('INSERT INTO socks (title, description, price_cents, image, stock) VALUES (?, ?, ?, ?, ?)').run(title, description, price, image, stock);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { loadEnv } = await import('./config/env.js');
  const { openDb } = await import('./db.js');
  const env = loadEnv();
  seed(env, openDb(env.DB_PATH));
  console.log('Seed done');
}
