import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export type Db = DatabaseSync;

export function openDb(file: string): Db {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin'))
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS socks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    image TEXT,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0)
  )`);
  return db;
}

export interface UserRow { id: number; name: string; email: string; password_hash: string; role: 'user' | 'admin' }
export const publicUser = (u: UserRow) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

export const findUserByEmail = (db: Db, email: string) =>
  db.prepare('SELECT * FROM users WHERE email = ?').get(email) as unknown as UserRow | undefined;
export const findUserById = (db: Db, id: number) =>
  db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as UserRow | undefined;
export const insertUser = (db: Db, u: { name: string; email: string; passwordHash: string; role?: 'user' | 'admin' }) =>
  Number(db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(u.name, u.email, u.passwordHash, u.role ?? 'user').lastInsertRowid);
