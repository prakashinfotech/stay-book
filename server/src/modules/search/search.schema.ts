import { z } from 'zod';

export const searchQuerySchema = z
  .object({
    destination: z.string().min(1),
    checkin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
    checkout: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
    adults: z.coerce.number().int().min(1).default(1),
    children: z.coerce.number().int().min(0).default(0),
    rooms: z.coerce.number().int().min(1).default(1),
    category: z.enum(['HOTEL', 'APARTMENT', 'VILLA', 'HOSTEL', 'OTHER']).optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    stars: z.coerce.number().int().min(1).max(5).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .refine((data) => new Date(data.checkout) > new Date(data.checkin), {
    message: 'Checkout must be after checkin',
    path: ['checkout'],
  })
  .refine((data) => !data.minPrice || !data.maxPrice || data.minPrice <= data.maxPrice, {
    message: 'minPrice must be less than or equal to maxPrice',
    path: ['maxPrice'],
  });

export type SearchQueryDto = z.infer<typeof searchQuerySchema>;
