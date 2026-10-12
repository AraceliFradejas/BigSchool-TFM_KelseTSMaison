import { z } from 'zod';
import { categories, catalogueSizes } from './rules.js';

const positiveInteger = (maximum) =>
  z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().int().max(maximum));
export const catalogQuerySchema = z.object({
  q: z.string().max(120).default(''),
  category: z.enum(categories).optional(),
  collection: z.string().max(120).optional(),
  available: z.literal('1').optional(),
  luxury: z.literal('1').optional(),
  runway: z.literal('1').optional(),
  size: z.enum(catalogueSizes).optional(),
  maxPriceCents: positiveInteger(1000000).optional(),
  sort: z.enum(['editorial', 'price-asc', 'price-desc']).default('editorial'),
  page: positiveInteger(1000000).default(1),
});
