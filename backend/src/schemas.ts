import { z } from 'zod';

// Text fields are stored without HTML: tags removed, stray angle brackets dropped.
export const cleanText = (max: number) =>
  z.string().transform((s) => s.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim()).pipe(z.string().min(1).max(max));

const email = z.string().trim().toLowerCase().pipe(z.string().email().max(254));

export const registerSchema = z.object({ name: cleanText(80), email, password: z.string().min(8).max(72) });
export const loginSchema = z.object({ email, password: z.string().min(1).max(72) });

// Multipart fields arrive as strings, hence the coercion.
export const sockSchema = z.object({
  title: cleanText(120),
  description: cleanText(2000),
  priceCents: z.coerce.number().int().min(0).max(10_000_000),
  stock: z.coerce.number().int().min(0).max(100_000),
});

export const orderSchema = z.object({
  items: z.array(z.object({ sockId: z.number().int().positive(), qty: z.number().int().min(1).max(99) })).min(1).max(50),
});
