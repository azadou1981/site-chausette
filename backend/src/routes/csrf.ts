import { Router } from 'express';
import type { Env } from '../config/env.js';
import { csrfCookie, newCsrfToken } from '../middleware/csrf.js';

export function csrfRouter(env: Env) {
  const r = Router();
  r.get('/csrf', (_req, res) => {
    const csrfToken = newCsrfToken();
    res.cookie('csrf', csrfToken, csrfCookie(env));
    res.json({ csrfToken });
  });
  return r;
}
