import { Router } from 'express';
import type { Env } from '../config/env.js';
import type { Db } from '../db.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { orderSchema } from '../schemas.js';

interface OrderRow { id: number; user_id: number; total_cents: number; created_at: string; user_name?: string; user_email?: string }
interface ItemRow { order_id: number; sock_id: number | null; title: string; unit_price_cents: number; qty: number }

export function ordersRouter(env: Env, db: Db) {
  const r = Router();
  const auth = requireAuth(env, db);

  const load = (rows: OrderRow[]) => {
    if (!rows.length) return [];
    const items = db.prepare(`SELECT * FROM order_items WHERE order_id IN (${rows.map(() => '?').join(',')}) ORDER BY id`).all(...rows.map((o) => o.id)) as unknown as ItemRow[];
    return rows.map((o) => ({
      id: o.id,
      totalCents: o.total_cents,
      createdAt: o.created_at,
      ...(o.user_email ? { user: { id: o.user_id, name: o.user_name, email: o.user_email } } : {}),
      items: items.filter((i) => i.order_id === o.id).map((i) => ({ sockId: i.sock_id, title: i.title, unitPriceCents: i.unit_price_cents, qty: i.qty })),
    }));
  };

  r.post('/orders', auth, validateBody(orderSchema), (req, res) => {
    // Merge duplicate lines; prices come from the DB, never from the client.
    const wanted = new Map<number, number>();
    for (const { sockId, qty } of req.body.items as { sockId: number; qty: number }[]) wanted.set(sockId, (wanted.get(sockId) ?? 0) + qty);
    db.exec('BEGIN IMMEDIATE');
    try {
      let total = 0;
      const lines: { id: number; title: string; price: number; qty: number }[] = [];
      for (const [id, qty] of wanted) {
        const s = db.prepare('SELECT id, title, price_cents, stock FROM socks WHERE id = ?').get(id) as unknown as { id: number; title: string; price_cents: number; stock: number } | undefined;
        if (!s) { db.exec('ROLLBACK'); return res.status(400).json({ error: { code: 'UNKNOWN_SOCK', message: `Sock ${id} does not exist` } }); }
        if (qty > s.stock) { db.exec('ROLLBACK'); return res.status(409).json({ error: { code: 'OUT_OF_STOCK', message: `Not enough stock for ${s.title}` } }); }
        total += s.price_cents * qty;
        lines.push({ id: s.id, title: s.title, price: s.price_cents, qty });
      }
      const orderId = Number(db.prepare('INSERT INTO orders (user_id, total_cents) VALUES (?, ?)').run(req.user!.id, total).lastInsertRowid);
      for (const l of lines) {
        db.prepare('INSERT INTO order_items (order_id, sock_id, title, unit_price_cents, qty) VALUES (?, ?, ?, ?, ?)').run(orderId, l.id, l.title, l.price, l.qty);
        db.prepare('UPDATE socks SET stock = stock - ? WHERE id = ?').run(l.qty, l.id);
      }
      db.exec('COMMIT');
      res.status(201).json(load(db.prepare('SELECT * FROM orders WHERE id = ?').all(orderId) as unknown as OrderRow[])[0]);
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  });

  r.get('/orders', auth, (req, res) => {
    res.json({ items: load(db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC').all(req.user!.id) as unknown as OrderRow[]) });
  });

  r.get('/admin/orders', auth, requireAdmin, (_req, res) => {
    res.json({ items: load(db.prepare('SELECT o.*, u.name AS user_name, u.email AS user_email FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.id DESC').all() as unknown as OrderRow[]) });
  });
  return r;
}
