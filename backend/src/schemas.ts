import { z } from 'zod';

// Text fields are stored without HTML: tags removed, stray angle brackets dropped.
export const cleanText = (max: number) =>
  z.string().transform((s) => s.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim()).pipe(z.string().min(1).max(max));

const email = z.string().trim().toLowerCase().pipe(z.string().email().max(254));

export const registerSchema = z.object({ name: cleanText(80), email, password: z.string().min(8).max(72) });
export const loginSchema = z.object({ email, password: z.string().min(1).max(72) });
