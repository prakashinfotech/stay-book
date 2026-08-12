import { z } from 'zod';

export const updatePropertyStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'DRAFT', 'PAUSED']),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['CUSTOMER', 'PARTNER']),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['CANCELLED', 'COMPLETED', 'NO_SHOW']),
});

export const approvePropertySchema = z.object({
  note: z.string().max(500).optional(),
});

export const rejectPropertySchema = z.object({
  reason: z.string().min(10).max(500),
});

export const approveKycSchema = z.object({
  note: z.string().max(500).optional(),
});

export const rejectKycSchema = z.object({
  reason: z.string().min(10).max(500),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().max(100).optional(),
  status: z.string().optional(),
  role: z.string().optional(),
  kycStatus: z.string().optional(),
  entityType: z.string().optional(),
});

export type UpdatePropertyStatusDto = z.infer<typeof updatePropertyStatusSchema>;
export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;
export type UpdateBookingStatusDto = z.infer<typeof updateBookingStatusSchema>;
export type ApprovePropertyDto = z.infer<typeof approvePropertySchema>;
export type RejectPropertyDto = z.infer<typeof rejectPropertySchema>;
export type ApproveKycDto = z.infer<typeof approveKycSchema>;
export type RejectKycDto = z.infer<typeof rejectKycSchema>;
export type ListQueryDto = z.infer<typeof listQuerySchema>;
