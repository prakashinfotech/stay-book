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
    DEV_BYPASS_PAYMENT: true,
    RAZORPAY_KEY_ID: 'rzp_test_fake_key',
    RAZORPAY_KEY_SECRET: 'test-secret',
    GEMINI_API_KEY: undefined,
  },
}));

// Mock the service with a factory — the shared mockService object is returned
// for every `new BookingsService()` call (including inside the controller).
jest.mock('../bookings.service', () => {
  const mockService = {
    createHold: jest.fn(),
    createBooking: jest.fn(),
    getMyBookings: jest.fn(),
    getBookingById: jest.fn(),
    cancelBooking: jest.fn(),
  };
  return {
    BookingsService: jest.fn().mockImplementation(() => mockService),
    __mockService: mockService,
  };
});

import { createApp } from '../../../app';

const app = createApp();

// Retrieve the shared mock service that the controller uses
const { __mockService: svc } = require('../bookings.service');

const CUSTOMER_ID = 'customer-1234-1234-1234-123456789012';
const OTHER_USER_ID = 'other-user-1234-5678-9012-345678901234';
const BOOKING_ID = 'booking-uuid-1234-1234-1234-123456789012';
const HOLD_ID = 'hold-uuid-abcd-abcd-abcd-abcdef123456';
const ROOM_TYPE_ID = '11111111-1111-1111-1111-111111111111';
const PROPERTY_ID = '22222222-2222-2222-2222-222222222222';

const mockBooking = {
  id: BOOKING_ID,
  userId: CUSTOMER_ID,
  status: 'CONFIRMED',
  roomTypeId: ROOM_TYPE_ID,
  propertyId: PROPERTY_ID,
  checkin: new Date('2026-07-01'),
  checkout: new Date('2026-07-03'),
  totalPrice: 2000,
  confirmationNumber: 'CONF-001',
  pin: '1234',
  adults: 2,
  children: 0,
  guestDetails: {},
  roomType: { name: 'Standard' },
  property: { name: 'Test Hotel', city: 'Mumbai' },
};

function makeToken(userId = CUSTOMER_ID, role = 'CUSTOMER') {
  return jwt.sign(
    { id: userId, email: 'test@example.com', role },
    'test-secret-at-least-20-chars-long',
    { expiresIn: '1h' },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  svc.createHold.mockResolvedValue({ id: HOLD_ID });
  svc.createBooking.mockResolvedValue(mockBooking);
  svc.getMyBookings.mockResolvedValue({ data: [mockBooking], total: 1, page: 1, limit: 20 });
  svc.getBookingById.mockResolvedValue(mockBooking);
  svc.cancelBooking.mockResolvedValue({ ...mockBooking, status: 'CANCELLED' });
});

// ─── Auth guards ───────────────────────────────────────────────────────────────

describe('Auth guards', () => {
  it('401 — POST /hold without token', async () => {
    const res = await request(app).post('/api/v1/bookings/hold').send({});
    expect(res.status).toBe(401);
  });

  it('401 — GET / without token', async () => {
    const res = await request(app).get('/api/v1/bookings');
    expect(res.status).toBe(401);
  });

  it('403 — PARTNER role cannot create hold', async () => {
    const res = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${makeToken(CUSTOMER_ID, 'PARTNER')}`)
      .send({
        roomTypeId: ROOM_TYPE_ID,
        propertyId: PROPERTY_ID,
        checkin: '2026-07-01',
        checkout: '2026-07-03',
        adults: 2,
        children: 0,
      });
    expect(res.status).toBe(403);
  });
});

// ─── POST /hold ────────────────────────────────────────────────────────────────

describe('POST /api/v1/bookings/hold', () => {
  const validHold = {
    roomTypeId: ROOM_TYPE_ID,
    propertyId: PROPERTY_ID,
    checkin: '2026-07-01',
    checkout: '2026-07-03',
    adults: 2,
    children: 0,
  };

  it('201 — creates hold for valid customer', async () => {
    const res = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validHold);

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(HOLD_ID);
  });

  it('400 — non-UUID roomTypeId rejected by schema (service not called)', async () => {
    const res = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validHold, roomTypeId: 'not-a-uuid' });

    expect(res.status).toBe(400);
    expect(svc.createHold).not.toHaveBeenCalled();
  });

  it('400 — checkout before checkin rejected by schema refine (service not called)', async () => {
    const res = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validHold, checkin: '2026-07-03', checkout: '2026-07-01' });

    expect(res.status).toBe(400);
    expect(svc.createHold).not.toHaveBeenCalled();
  });

  it('404 — room type not found', async () => {
    const { NotFoundError } = require('../../../common/errors/app-error');
    svc.createHold.mockRejectedValue(new NotFoundError('Room type not found for this property'));

    const res = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validHold);

    expect(res.status).toBe(404);
  });

  it('409 ROOM_NOT_AVAILABLE — dates blocked', async () => {
    const { AppError } = require('../../../common/errors/app-error');
    svc.createHold.mockRejectedValue(new AppError(409, 'ROOM_NOT_AVAILABLE', 'Room not available'));

    const res = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validHold);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ROOM_NOT_AVAILABLE');
  });
});

// ─── GET / ─────────────────────────────────────────────────────────────────────

describe('GET /api/v1/bookings', () => {
  it('200 — returns booking list for authenticated customer', async () => {
    const res = await request(app)
      .get('/api/v1/bookings')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });
});

// ─── GET /:id ──────────────────────────────────────────────────────────────────

describe('GET /api/v1/bookings/:id', () => {
  it('200 — returns single booking for correct user', async () => {
    const res = await request(app)
      .get(`/api/v1/bookings/${BOOKING_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(BOOKING_ID);
  });

  it('404 — another user\'s booking returns not found', async () => {
    const { NotFoundError } = require('../../../common/errors/app-error');
    svc.getBookingById.mockRejectedValue(new NotFoundError('Booking not found'));

    const res = await request(app)
      .get(`/api/v1/bookings/${BOOKING_ID}`)
      .set('Authorization', `Bearer ${makeToken(OTHER_USER_ID)}`);

    expect(res.status).toBe(404);
  });
});

// ─── POST /:id/cancel ──────────────────────────────────────────────────────────

describe('POST /api/v1/bookings/:id/cancel', () => {
  it('200 — cancels a confirmed booking', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${BOOKING_ID}/cancel`)
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('409 BOOKING_NOT_CANCELLABLE — already cancelled', async () => {
    const { AppError } = require('../../../common/errors/app-error');
    svc.cancelBooking.mockRejectedValue(new AppError(409, 'BOOKING_NOT_CANCELLABLE', 'Already cancelled'));

    const res = await request(app)
      .post(`/api/v1/bookings/${BOOKING_ID}/cancel`)
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('BOOKING_NOT_CANCELLABLE');
  });
});
