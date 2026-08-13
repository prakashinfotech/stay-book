import bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { ConflictError, AppError } from '../../../common/errors/app-error';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    otpToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../../config/env', () => ({
  config: {
    NODE_ENV: 'development',
    JWT_SECRET: 'test-secret-at-least-20-chars-long',
    JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-20-chars',
    JWT_EXPIRATION: '1h',
  },
}));

jest.mock('../../../utils/email.util', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('bcrypt');

const { prisma } = require('../../../config/prisma');

const mockUser = {
  id: 'user-uuid-123',
  email: 'test@example.com',
  passwordHash: 'hashed',
  role: 'CUSTOMER' as const,
  emailVerified: false,
  firstName: 'Test',
  lastName: 'User',
  createdAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('returns userId and devOtp in development mode', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.otpToken.create.mockResolvedValue({});
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.register({
        email: 'test@example.com',
        password: 'Password1',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
      });

      expect(result.userId).toBe('user-uuid-123');
      expect(result.devOtp).toBeDefined();
      expect(result.devOtp).toMatch(/^\d{6}$/);
    });

    it('throws ConflictError when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'Password1',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('verifyOtp', () => {
    it('returns accessToken and user on valid code', async () => {
      prisma.otpToken.findFirst.mockResolvedValue({
        id: 'token-id',
        userId: mockUser.id,
        codeHash: 'hashed-otp',
        used: false,
        expiresAt: new Date(Date.now() + 600_000),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.$transaction.mockResolvedValue([]);
      prisma.user.findUniqueOrThrow.mockResolvedValue({ ...mockUser, emailVerified: true });

      const result = await service.verifyOtp(mockUser.id, '123456');

      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toBe(mockUser.email);
    });

    it('throws AppError when OTP not found', async () => {
      prisma.otpToken.findFirst.mockResolvedValue(null);

      await expect(service.verifyOtp(mockUser.id, '000000')).rejects.toThrow(AppError);
    });

    it('throws AppError when OTP code is wrong', async () => {
      prisma.otpToken.findFirst.mockResolvedValue({
        id: 'token-id',
        userId: mockUser.id,
        codeHash: 'hashed-otp',
        used: false,
        expiresAt: new Date(Date.now() + 600_000),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.verifyOtp(mockUser.id, '000000')).rejects.toThrow(AppError);
    });
  });

  describe('login', () => {
    it('throws 403 EMAIL_NOT_VERIFIED when user is unverified', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, emailVerified: false });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login({ email: 'test@example.com', password: 'Password1' }))
        .rejects.toMatchObject({ statusCode: 403, code: 'EMAIL_NOT_VERIFIED' });
    });

    it('throws UnauthorizedError for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, emailVerified: true });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: 'test@example.com', password: 'wrong' }))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('returns tokens and user on valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, emailVerified: true });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue({});

      const result = await service.login({ email: 'test@example.com', password: 'Password1' });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe(mockUser.email);
    });
  });

  describe('resendOtp', () => {
    it('returns devOtp and invalidates previous tokens', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, emailVerified: false });
      prisma.otpToken.updateMany.mockResolvedValue({ count: 1 });
      prisma.otpToken.create.mockResolvedValue({});
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-otp');

      const result = await service.resendOtp({ userId: mockUser.id });

      expect(prisma.otpToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: mockUser.id }) }),
      );
      expect(result.devOtp).toMatch(/^\d{6}$/);
    });

    it('throws 409 ALREADY_VERIFIED when user email is verified', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, emailVerified: true });

      await expect(service.resendOtp({ userId: mockUser.id }))
        .rejects.toMatchObject({ statusCode: 409, code: 'ALREADY_VERIFIED' });
    });

    it('throws 404 when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.resendOtp({ userId: 'non-existent-id' }))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
