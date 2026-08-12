import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8),
  firstName: z.string().min(1).trim(),
  lastName: z.string().min(1).trim(),
  role: z.enum(['CUSTOMER', 'PARTNER']).default('CUSTOMER'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const resendOtpSchema = z.object({
  userId: z.string().uuid(),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type ResendOtpDto = z.infer<typeof resendOtpSchema>;

export interface TokenPairDto {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponseDto extends TokenPairDto {
  user: import('../users/users.schema').UserResponseDto;
}
