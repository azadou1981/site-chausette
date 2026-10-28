import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

export const validateBody = <T>(schema: ZodType<T>): RequestHandler => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Invalid input', details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) } });
  }
  req.body = parsed.data;
  next();
};
