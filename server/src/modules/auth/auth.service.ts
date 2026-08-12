import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { UnauthorizedError, ConflictError, AppError } from '../../common/errors/app-error';
import { logger } from '../../common/utils/logger';
import { config } from '../../config/env';
import { prisma } from '../../config/prisma';
import { sendOtpEmail } from '../../utils/email.util';
import { LoginDto, RegisterDto, TokenPairDto, LoginResponseDto, ResendOtpDto } from './auth.schema';
import { UserResponseDto } from '../users/users.schema';

export class AuthService {
  async register(dto: RegisterDto): Promise<{ userId: string; devOtp?: string }> {
    try {
      const existing = await prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictError('Email already registered', 'EMAIL_IN_USE');

      const ROUNDS = config.NODE_ENV === 'production' ? 12 : 10;
      const passwordHash = await bcrypt.hash(dto.password, ROUNDS);
      const user = await prisma.user.create({
        data: { email: dto.email, passwordHash, firstName: dto.firstName, lastName: dto.lastName, role: dto.role as Role },
      });

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = await bcrypt.hash(code, ROUNDS);
      await prisma.otpToken.create({
        data: { userId: user.id, codeHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      });

      await sendOtpEmail({ to: user.email, code });
      logger.info('User registered', { userId: user.id });
      return config.NODE_ENV === 'development'
        ? { userId: user.id, devOtp: code }
        : { userId: user.id };
    } catch (error) {
      logger.error('Register failed', { error });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'REGISTER_FAILED', 'Registration failed');
    }
  }

  async resendOtp(dto: ResendOtpDto): Promise<{ devOtp?: string }> {
    try {
      const user = await prisma.user.findUnique({ where: { id: dto.userId } });
      if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
      if (user.emailVerified) throw new ConflictError('Email is already verified', 'ALREADY_VERIFIED');

      await prisma.otpToken.updateMany({ where: { userId: dto.userId, used: false }, data: { used: true } });

      const ROUNDS = config.NODE_ENV === 'production' ? 12 : 10;
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = await bcrypt.hash(code, ROUNDS);
      await prisma.otpToken.create({
        data: { userId: dto.userId, codeHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      });

      await sendOtpEmail({ to: user.email, code });
      logger.info('OTP resent', { userId: dto.userId });
      return config.NODE_ENV === 'development' ? { devOtp: code } : {};
    } catch (error) {
      logger.error('Resend OTP failed', { error });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'RESEND_OTP_FAILED', 'Failed to resend OTP');
    }
  }

  async verifyOtp(userId: string, code: string): Promise<{ accessToken: string; user: UserResponseDto }> {
    try {
      const token = await prisma.otpToken.findFirst({
        where: { userId, used: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      });

      if (!token) throw new AppError(400, 'OTP_INVALID', 'OTP is invalid or expired');

      const valid = await bcrypt.compare(code, token.codeHash);
      if (!valid) throw new AppError(400, 'OTP_WRONG', 'Incorrect OTP code');

      await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { emailVerified: true } }),
        prisma.otpToken.update({ where: { id: token.id }, data: { used: true } }),
      ]);

      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      const accessToken = this.signAccessToken(user.id, user.email, user.role);
      return { accessToken, user: this.sanitize(user) };
    } catch (error) {
      logger.error('OTP verification failed', { error });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'OTP_FAILED', 'OTP verification failed');
    }
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    try {
      const user = await prisma.user.findUnique({ where: { email: dto.email } });
      if (!user) throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');

      const valid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!valid) throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');

      if (!user.emailVerified) {
        throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email first');
      }

      const accessToken = this.signAccessToken(user.id, user.email, user.role);
      const refreshToken = this.signRefreshToken(user.id);
      await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

      logger.info('User logged in', { userId: user.id });
      return { accessToken, refreshToken, user: this.sanitize(user) };
    } catch (error) {
      logger.error('Login failed', { error });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'LOGIN_FAILED', 'Login failed');
    }
  }

  async refresh(token: string): Promise<TokenPairDto> {
    let payload: { id: string };
    try {
      payload = jwt.verify(token, config.JWT_REFRESH_SECRET) as { id: string };
    } catch {
      throw new UnauthorizedError('Invalid refresh token', 'TOKEN_INVALID');
    }

    const user = await prisma.user.findFirst({ where: { id: payload.id, refreshToken: token } });
    if (!user) throw new UnauthorizedError('Invalid refresh token', 'TOKEN_INVALID');

    const accessToken = this.signAccessToken(user.id, user.email, user.role);
    const refreshToken = this.signRefreshToken(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
    return { accessToken, refreshToken };
  }

  async logout(userId: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
    logger.info('User logged out', { userId });
  }

  private signAccessToken(id: string, email: string, role: Role): string {
    return jwt.sign({ id, email, role }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRATION as `${number}${'s'|'m'|'h'|'d'}` | number });
  }

  private signRefreshToken(id: string): string {
    return jwt.sign({ id }, config.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }

  private sanitize(user: { id: string; email: string; firstName: string | null; lastName: string | null; role: Role; emailVerified: boolean; createdAt: Date }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }
}
