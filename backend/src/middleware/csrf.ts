import crypto from 'node:crypto';
import type { RequestHandler } from 'express';
import type { Env } from '../config/env.js';

// Double-submit token: cookie `csrf` must equal the X-CSRF-Token header on unsafe methods.
export const csrfCookie = (env: Env) => ({ sameSite: 'lax' as const, secure: env.NODE_ENV === 'production', path: '/' });

export const newCsrfToken = () => crypto.randomBytes(32).toString('hex');

export const csrfProtection: RequestHandler = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const cookie = req.cookies?.csrf;
  const header = req.get('x-csrf-token');
  if (!cookie || !header || cookie.length !== header.length || !crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(header))) {
    return res.status(403).json({ error: { code: 'CSRF', message: 'Invalid or missing CSRF token' } });
  }
  next();
};
