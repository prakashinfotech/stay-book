import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().nonnegative(),
  category: z.enum(['ROOM', 'FOOD', 'TRANSPORT', 'ACTIVITY', 'OTHER']),
  propertyId: z.string().uuid(),
  available: z.boolean().default(true),
});

export type CreateServiceDto = z.infer<typeof createServiceSchema>;
