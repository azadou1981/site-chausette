import { Router } from 'express';
import type { Env } from '../config/env.js';
import type { Db } from '../db.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { removeUpload, uploadImage } from '../middleware/upload.js';
import { sockSchema } from '../schemas.js';

interface SockRow { id: number; title: string; description: string; price_cents: number; image: string | null; stock: number }
const toSock = (r: SockRow) => ({ id: r.id, title: r.title, description: r.description, priceCents: r.price_cents, imageUrl: r.image ? `/uploads/${r.image}` : null, stock: r.stock });
const PAGE_SIZE = 12;
const err = (res: import('express').Response, status: number, code: string, message: string, details?: unknown) =>
  res.status(status).json({ error: { code, message, details } });

export function socksRouter(env: Env, db: Db) {
  const r = Router();
  const get = (id: number) => db.prepare('SELECT * FROM socks WHERE id = ?').get(id) as unknown as SockRow | undefined;
  const admin = [requireAuth(env, db), requireAdmin, uploadImage(env)];
  // Parses the multipart fields; deletes the just-uploaded file when they are invalid.
  const parse = (req: import('express').Request, res: import('express').Response) => {
    const p = sockSchema.safeParse(req.body);
    if (p.success) return p.data;
    removeUpload(env, req.file?.filename);
    err(res, 400, 'VALIDATION', 'Invalid input', p.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
  };

  r.get('/socks', (req, res) => {
    const page = Math.max(1, Math.floor(Number(req.query.page)) || 1);
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    const like = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
    const where = q ? "WHERE title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\'" : '';
    const args = q ? [like, like] : [];
    const total = (db.prepare(`SELECT COUNT(*) AS n FROM socks ${where}`).get(...args) as { n: number }).n;
    const rows = db.prepare(`SELECT * FROM socks ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...args, PAGE_SIZE, (page - 1) * PAGE_SIZE) as unknown as SockRow[];
    res.json({ items: rows.map(toSock), page, pageSize: PAGE_SIZE, total });
  });

  r.get('/socks/:id', (req, res) => {
    const row = get(Number(req.params.id));
    return row ? res.json(toSock(row)) : err(res, 404, 'NOT_FOUND', 'Sock not found');
  });

  r.post('/socks', ...admin, (req, res) => {
    const d = parse(req, res);
    if (!d) return;
    if (!req.file) return err(res, 400, 'VALIDATION', 'Image is required');
    const id = Number(db.prepare('INSERT INTO socks (title, description, price_cents, image, stock) VALUES (?, ?, ?, ?, ?)').run(d.title, d.description, d.priceCents, req.file.filename, d.stock).lastInsertRowid);
    res.status(201).json(toSock(get(id)!));
  });

  r.put('/socks/:id', ...admin, (req, res) => {
    const d = parse(req, res);
    if (!d) return;
    const old = get(Number(req.params.id));
    if (!old) { removeUpload(env, req.file?.filename); return err(res, 404, 'NOT_FOUND', 'Sock not found'); }
    const image = req.file?.filename ?? old.image;
    db.prepare('UPDATE socks SET title = ?, description = ?, price_cents = ?, image = ?, stock = ? WHERE id = ?').run(d.title, d.description, d.priceCents, image, d.stock, old.id);
    if (req.file) removeUpload(env, old.image);
    res.json(toSock(get(old.id)!));
  });

  r.delete('/socks/:id', requireAuth(env, db), requireAdmin, (req, res) => {
    const old = get(Number(req.params.id));
    if (!old) return err(res, 404, 'NOT_FOUND', 'Sock not found');
    db.prepare('DELETE FROM socks WHERE id = ?').run(old.id);
    removeUpload(env, old.image);
    res.status(204).end();
  });
  return r;
}
