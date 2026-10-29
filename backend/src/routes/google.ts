import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import type { Env } from '../config/env.js';
import { findUserByEmail, findUserByGoogleId, insertUser, type Db } from '../db.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { sessionStarter } from './auth.js';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

// Authorization-code flow; the state cookie (httpOnly, lax, short-lived) defends against login CSRF.
export function googleRouter(env: Env, db: Db) {
  const r = Router();
  const limiter = authLimiter(env);
  const startSession = sessionStarter(env);
  const redirectUri = env.GOOGLE_REDIRECT_URI ?? `http://localhost:${env.PORT}/api/auth/google/callback`;
  const stateCookie = { httpOnly: true, sameSite: 'lax' as const, secure: env.NODE_ENV === 'production', path: '/api/auth/google', maxAge: 10 * 60 * 1000 };
  const fail = (res: import('express').Response) => res.clearCookie('g_state', stateCookie).redirect(`${env.FRONTEND_ORIGIN}/login?error=google`);

  r.get('/auth/google', limiter, (_req, res) => {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return res.status(503).json({ error: { code: 'GOOGLE_NOT_CONFIGURED', message: 'Google sign-in is not configured' } });
    const state = crypto.randomBytes(24).toString('hex');
    res.cookie('g_state', state, stateCookie);
    const q = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri, response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' });
    res.redirect(`${AUTH_URL}?${q}`);
  });

  r.get('/auth/google/callback', limiter, async (req, res) => {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return fail(res);
    const { code, state } = req.query;
    const saved = req.cookies?.g_state;
    if (typeof code !== 'string' || typeof state !== 'string' || typeof saved !== 'string' || saved.length !== state.length
      || !crypto.timingSafeEqual(Buffer.from(saved), Buffer.from(state))) return fail(res);
    try {
      const tokenRes = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
      });
      if (!tokenRes.ok) return fail(res);
      const { access_token } = (await tokenRes.json()) as { access_token?: string };
      const infoRes = await fetch(USERINFO_URL, { headers: { authorization: `Bearer ${access_token}` } });
      if (!access_token || !infoRes.ok) return fail(res);
      const info = (await infoRes.json()) as { sub?: string; email?: string; email_verified?: boolean; name?: string };
      if (!info.sub || !info.email || info.email_verified !== true) return fail(res);
      const email = info.email.toLowerCase();
      let userId = findUserByGoogleId(db, info.sub)?.id;
      if (!userId) {
        const existing = findUserByEmail(db, email);
        if (existing) {
          db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(info.sub, existing.id);
          userId = existing.id;
        } else {
          // Random unusable password: the account can only sign in through Google until a password is set.
          userId = insertUser(db, { name: info.name || email.split('@')[0], email, passwordHash: bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), env.BCRYPT_ROUNDS), googleId: info.sub });
        }
      }
      startSession(res, userId);
      res.clearCookie('g_state', stateCookie).redirect(env.FRONTEND_ORIGIN);
    } catch {
      fail(res);
    }
  });
  return r;
}
