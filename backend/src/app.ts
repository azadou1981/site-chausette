import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import type { Env } from './config/env.js';
import { csrfProtection } from './middleware/csrf.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFound } from './middleware/error.js';
import { csrfRouter } from './routes/csrf.js';
import { authRouter } from './routes/auth.js';
import { openDb, type Db } from './db.js';

export function createApp(env: Env, db: Db = openDb(env.DB_PATH)) {
  const app = express();
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], imgSrc: ["'self'"], frameAncestors: ["'none'"] } },
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // uploaded images are shown by the frontend origin
    }),
  );
  app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
  app.use(globalLimiter(env));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use('/api', csrfProtection);
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api', csrfRouter(env));
  app.use('/api', authRouter(env, db));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
