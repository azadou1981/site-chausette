import rateLimit from 'express-rate-limit';
import type { Env } from '../config/env.js';

const tooMany = { error: { code: 'RATE_LIMIT', message: 'Too many requests, try again later' } };

export const globalLimiter = (env: Env) =>
  rateLimit({ windowMs: 60_000, limit: env.RATE_LIMIT_MAX, standardHeaders: true, legacyHeaders: false, message: tooMany });

// Stricter limiter for login/register (used by the auth routes).
export const authLimiter = (env: Env) =>
  rateLimit({ windowMs: 15 * 60_000, limit: env.AUTH_RATE_LIMIT_MAX, standardHeaders: true, legacyHeaders: false, message: tooMany });
