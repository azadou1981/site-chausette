import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Env } from '../config/env.js';
import { findUserByEmail, insertUser, findUserById, publicUser, type Db } from '../db.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../schemas.js';

// Hash of a dummy password so unknown emails cost the same time as wrong passwords.
const dummyHash = bcrypt.hashSync('dummy-password', 4);

export const sessionStarter = (env: Env) => (res: import('express').Response, id: number) => {
  const token = jwt.sign({}, env.JWT_SECRET, { subject: String(id), expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'], algorithm: 'HS256' });
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production', path: '/' });
};

export function authRouter(env: Env, db: Db) {
  const r = Router();
  const limiter = authLimiter(env);
  const cookieOpts = { httpOnly: true, sameSite: 'lax' as const, secure: env.NODE_ENV === 'production', path: '/' };
  const startSession = sessionStarter(env);

  r.post('/auth/register', limiter, validateBody(registerSchema), async (req, res) => {
    const { name, email, password } = req.body;
    if (findUserByEmail(db, email)) return res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'Email already registered' } });
    const id = insertUser(db, { name, email, passwordHash: await bcrypt.hash(password, env.BCRYPT_ROUNDS) });
    startSession(res, id);
    res.status(201).json({ user: publicUser(findUserById(db, id)!) });
  });

  r.post('/auth/login', limiter, validateBody(loginSchema), async (req, res) => {
    const { email, password } = req.body;
    const user = findUserByEmail(db, email);
    const ok = await bcrypt.compare(password, user?.password_hash ?? dummyHash);
    if (!user || !ok) return res.status(401).json({ error: { code: 'BAD_CREDENTIALS', message: 'Invalid email or password' } });
    startSession(res, user.id);
    res.json({ user: publicUser(user) });
  });

  r.post('/auth/logout', (_req, res) => {
    res.clearCookie('token', cookieOpts);
    res.json({ ok: true });
  });

  r.get('/auth/me', requireAuth(env, db), (req, res) => res.json({ user: publicUser(req.user!) }));
  return r;
}
