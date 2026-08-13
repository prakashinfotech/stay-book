import request from 'supertest';
import jwt from 'jsonwebtoken';

// Env mock must be first — Razorpay reads key_id at module load
jest.mock('../../../config/env', () => ({
  config: {
    NODE_ENV: 'development',
    PORT: 3001,
    CLIENT_URL: 'http://localhost:3000',
    JWT_SECRET: 'test-secret-at-least-20-chars-long',
    JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-20-chars',
    JWT_EXPIRATION: '1h',
    RAZORPAY_KEY_ID: 'rzp_test_fake_key',
    RAZORPAY_KEY_SECRET: 'test-secret',
    GEMINI_API_KEY: undefined,
  },
}));

// Mock the service with a factory — the shared mockService object is returned
// for every `new AuthService()` call (including inside the controller).
jest.mock('../auth.service', () => {
  const mockService = {
    register: jest.fn(),
    login: jest.fn(),
    verifyOtp: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    resendOtp: jest.fn(),
  };
  return {
    AuthService: jest.fn().mockImplementation(() => mockService),
    __mockService: mockService,
  };
});

import { createApp } from '../../../app';

const app = createApp();

// Retrieve the shared mock service that the controller uses
const { __mockService: svc } = require('../auth.service');

const USER_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function makeToken(id = USER_ID, role = 'CUSTOMER') {
  return jwt.sign(
    { id, email: 'test@example.com', role },
    'test-secret-at-least-20-chars-long',
    { expiresIn: '1h' },
  );
}

const okResult = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: { id: USER_ID, email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'CUSTOMER' },
};

beforeEach(() => {
  jest.clearAllMocks();
  svc.register.mockResolvedValue({ userId: USER_ID, devOtp: '123456' });
  svc.verifyOtp.mockResolvedValue(okResult);
  svc.login.mockResolvedValue(okResult);
  svc.refresh.mockResolvedValue({ accessToken: 'new-token', refreshToken: 'new-refresh' });
  svc.logout.mockResolvedValue(undefined);
  svc.resendOtp.mockResolvedValue({ devOtp: '654321' });
});

// ─── register ─────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/register', () => {
  it('201 — returns userId and devOtp on valid input', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'test@example.com',
      password: 'Password1',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.userId).toBe(USER_ID);
    expect(res.body.data.devOtp).toBe('123456');
  });

  it('409 EMAIL_IN_USE — duplicate email', async () => {
    const { ConflictError } = require('../../../common/errors/app-error');
    svc.register.mockRejectedValue(new ConflictError('Email already registered', 'EMAIL_IN_USE'));

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'test@example.com',
      password: 'Password1',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_IN_USE');
  });

  it('400 — rejects invalid email format (Zod validation, service not called)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      password: 'Password1',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(res.status).toBe(400);
    expect(svc.register).not.toHaveBeenCalled();
  });

  it('400 — rejects role ADMIN (schema only allows CUSTOMER/PARTNER)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'admin@example.com',
      password: 'Password1',
      firstName: 'Test',
      lastName: 'User',
      role: 'ADMIN',
    });

    expect(res.status).toBe(400);
    expect(svc.register).not.toHaveBeenCalled();
  });
});

// ─── verify-otp ───────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/verify-otp', () => {
  it('200 — returns accessToken on valid OTP', async () => {
    const res = await request(app).post('/api/v1/auth/verify-otp').send({
      userId: USER_ID,
      code: '123456',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('400 OTP_INVALID — OTP not found', async () => {
    const { AppError } = require('../../../common/errors/app-error');
    svc.verifyOtp.mockRejectedValue(new AppError(400, 'OTP_INVALID', 'OTP not found or expired'));

    const res = await request(app).post('/api/v1/auth/verify-otp').send({
      userId: USER_ID,
      code: '000000',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('OTP_INVALID');
  });

  it('400 OTP_INVALID — expired OTP (service returns same code)', async () => {
    const { AppError } = require('../../../common/errors/app-error');
    svc.verifyOtp.mockRejectedValue(new AppError(400, 'OTP_INVALID', 'OTP not found or expired'));

    const res = await request(app).post('/api/v1/auth/verify-otp').send({
      userId: USER_ID,
      code: '999999',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('OTP_INVALID');
  });
});

// ─── login ────────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {
  it('200 — returns tokens and user on valid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'Password1',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('403 EMAIL_NOT_VERIFIED — unverified email', async () => {
    const { AppError } = require('../../../common/errors/app-error');
    svc.login.mockRejectedValue(new AppError(403, 'EMAIL_NOT_VERIFIED', 'Email not verified'));

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'Password1',
    });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('401 — wrong password', async () => {
    const { AppError } = require('../../../common/errors/app-error');
    svc.login.mockRejectedValue(new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials'));

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'wrong',
    });

    expect(res.status).toBe(401);
  });
});

// ─── refresh ──────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/refresh', () => {
  it('401 — tampered refresh token', async () => {
    const { AppError } = require('../../../common/errors/app-error');
    svc.refresh.mockRejectedValue(new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid token'));

    const res = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: 'tampered-token',
    });

    expect(res.status).toBe(401);
  });

  it('200 — valid refresh token rotates tokens', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: 'valid-refresh-token',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/logout', () => {
  it('401 — no token provided', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(401);
  });

  it('200 — valid token clears session', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
  });
});

// ─── resend-otp ───────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/resend-otp', () => {
  it('201 — resends OTP for unverified user', async () => {
    const res = await request(app).post('/api/v1/auth/resend-otp').send({
      userId: USER_ID,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.devOtp).toBe('654321');
  });

  it('404 — user not found', async () => {
    const { AppError } = require('../../../common/errors/app-error');
    svc.resendOtp.mockRejectedValue(new AppError(404, 'USER_NOT_FOUND', 'User not found'));

    const res = await request(app).post('/api/v1/auth/resend-otp').send({
      userId: 'aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
    });

    expect(res.status).toBe(404);
  });

  it('409 ALREADY_VERIFIED — verified user', async () => {
    const { ConflictError } = require('../../../common/errors/app-error');
    svc.resendOtp.mockRejectedValue(new ConflictError('Email is already verified', 'ALREADY_VERIFIED'));

    const res = await request(app).post('/api/v1/auth/resend-otp').send({
      userId: USER_ID,
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALREADY_VERIFIED');
  });

  it('400 — non-UUID userId rejected by schema (service not called)', async () => {
    const res = await request(app).post('/api/v1/auth/resend-otp').send({
      userId: 'not-a-uuid',
    });

    expect(res.status).toBe(400);
    expect(svc.resendOtp).not.toHaveBeenCalled();
  });
});
