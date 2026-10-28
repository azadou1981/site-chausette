import jwt from 'jsonwebtoken';
import type { RequestHandler } from 'express';
import type { Env } from '../config/env.js';
import { findUserById, type Db, type UserRow } from '../db.js';

declare module 'express-serve-static-core' {
  interface Request { user?: UserRow }
}

const err = (code: string, message: string) => ({ error: { code, message } });

export const requireAuth = (env: Env, db: Db): RequestHandler => (req, res, next) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const { sub } = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
      const user = findUserById(db, Number(sub));
      if (user) { req.user = user; return next(); }
    } catch { /* fall through to 401 */ }
  }
  res.status(401).json(err('UNAUTHORIZED', 'Authentication required'));
};

export const requireAdmin: RequestHandler = (req, res, next) =>
  req.user?.role === 'admin' ? next() : res.status(403).json(err('FORBIDDEN', 'Admin only'));
