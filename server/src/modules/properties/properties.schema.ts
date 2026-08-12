import { z } from 'zod';

export const createPropertySchema = z.object({
  name: z.string().min(2).max(200).trim(),
  description: z.string().max(2000).optional(),
  address: z.string().min(5).trim(),
  city: z.string().min(2).trim(),
  postcode: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  category: z.enum(['HOTEL', 'APARTMENT', 'VILLA', 'HOSTEL', 'OTHER']),
  starRating: z.number().int().min(1).max(5).optional(),
  amenities: z.array(z.string()).default([]),
  bookingMode: z.enum(['INSTANT', 'REQUEST']).optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export const addRoomTypeSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
  maxOccupancy: z.number().int().min(1).max(30),
  basePrice: z.number().positive(),
  mealPlan: z.enum(['NONE', 'BREAKFAST']).default('NONE'),
  cancellationPolicy: z.enum(['FLEXIBLE', 'NON_REFUNDABLE']).default('FLEXIBLE'),
  bedConfig: z.record(z.unknown()).optional(),
});

export const addImagesSchema = z.object({
  images: z
    .array(
      z.object({
        url: z.string().url(),
        tag: z.enum(['EXTERIOR', 'BEDROOM', 'BATHROOM', 'DINING', 'COMMON']).default('COMMON'),
        sortOrder: z.number().int().min(0).default(0),
      }),
    )
    .min(1),
});

export const createRatePlanSchema = z.object({
  planType: z.enum(['NON_REFUNDABLE', 'WEEKLY']),
  discountPercent: z.number().min(0).max(100).optional(),
  minNights: z.number().int().min(1).optional(),
});

export type CreatePropertyDto    = z.infer<typeof createPropertySchema>;
export type UpdatePropertyDto    = z.infer<typeof updatePropertySchema>;
export type AddRoomTypeDto       = z.infer<typeof addRoomTypeSchema>;
export type AddImagesDto         = z.infer<typeof addImagesSchema>;
export type CreateRatePlanDto    = z.infer<typeof createRatePlanSchema>;
