import { z } from 'zod';

import { categories, orderStatuses, transitions } from './rules.js';
export { categories, orderStatuses, transitions };
const text = z.string().trim().min(1).max(120);
const bilingual = z.object({ es: text, en: text }).strict();
export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    password: z.string().min(10).max(128),
  })
  .strict();
export const loginSchema = registerSchema.pick({ email: true, password: true });
export const checkoutSchema = z
  .object({
    idempotencyKey: z.uuid(),
    lines: z
      .array(z.object({ variantId: text, quantity: z.number().int().min(1).max(10) }).strict())
      .min(1)
      .max(30),
  })
  .strict()
  .refine(
    (value) => new Set(value.lines.map((line) => line.variantId)).size === value.lines.length,
    { message: 'Duplicate variant' },
  );
export const variantSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,80}$/),
    label: bilingual,
    priceCents: z.number().int().min(1).max(1000000),
    stock: z.number().int().min(0).max(10000),
  })
  .strict();
export const productSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,80}$/),
    name: bilingual,
    description: z
      .object({ es: z.string().trim().min(10).max(2000), en: z.string().trim().min(10).max(2000) })
      .strict(),
    category: z.enum(categories),
    collectionId: text,
    image: z.string().regex(/^\/(?:media|uploads)\/[a-zA-Z0-9._-]+\.(?:svg|jpg|jpeg|png|webp)$/),
    active: z.boolean(),
    tags: z.array(z.string().regex(/^[a-z-]{1,40}$/)).max(20),
    variants: z.array(variantSchema).min(1).max(30),
  })
  .strict()
  .refine(
    (value) => new Set(value.variants.map((variant) => variant.id)).size === value.variants.length,
    { message: 'Duplicate variant' },
  );
export const stylistSchema = z
  .object({
    occasion: z.enum(['any', 'dinner', 'concert', 'weekend', 'everyday']),
    budgetCents: z.number().int().min(100).max(1000000),
    color: z.enum(['any', 'dark', 'red', 'natural', 'gold']),
    excludeBeauty: z.boolean().default(false),
  })
  .strict();
