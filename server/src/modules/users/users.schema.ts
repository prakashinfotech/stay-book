import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8),
  firstName: z.string().min(1).trim().optional(),
  lastName: z.string().min(1).trim().optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).trim().optional(),
  lastName: z.string().min(1).trim().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
}
