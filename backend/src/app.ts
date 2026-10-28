import express from 'express';
import type { Env } from './config/env.js';

export function createApp(_env: Env) {
  const app = express();
  app.disable('x-powered-by');
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  return app;
}
