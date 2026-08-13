import { BookingsService } from '../bookings.service';
import { AppError, NotFoundError, ForbiddenError } from '../../../common/errors/app-error';

jest.mock('../bookings.repository');
jest.mock('../../../config/prisma', () => ({
  prisma: {
    roomType: { findFirst: jest.fn() },
    ratePlan: { create: jest.fn() },
    property: { findUnique: jest.fn() },
  },
}));
jest.mock('../../../config/env', () => ({
  config: {
    NODE_ENV: 'development',
    DEV_BYPASS_PAYMENT: true,
    RAZORPAY_KEY_SECRET: 'test-secret',
  },
}));
jest.mock('../../../utils/email.util', () => ({
  sendBookingConfirmation: jest.fn().mockResolvedValue(undefined),
}));

const { BookingsRepository } = require('../bookings.repository');
const { prisma } = require('../../../config/prisma');

const mockHold = {
  id: 'hold-id',
  userId: 'user-id',
  roomTypeId: 'room-type-id',
  propertyId: 'property-id',
  checkin: new Date('2026-07-01'),
  checkout: new Date('2026-07-03'),
  expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  roomType: {
    id: 'room-type-id',
    name: 'Standard Room',
    basePrice: 1000,
    ratePlans: [{ id: 'rate-plan-id', planType: 'STANDARD', discountPercent: 0, minNights: 1 }],
  },
};

const mockBooking = {
  id: 'booking-id',
  userId: 'user-id',
  status: 'CONFIRMED',
  roomTypeId: 'room-type-id',
  checkin: new Date('2026-07-01'),
  checkout: new Date('2026-07-03'),
};

describe('BookingsService', () => {
  let service: BookingsService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      isRoomAvailable: jest.fn().mockResolvedValue(true),
      createHold: jest.fn().mockResolvedValue({ id: 'hold-id' }),
      findHoldById: jest.fn().mockResolvedValue(mockHold),
      createBookingWithTransaction: jest.fn().mockResolvedValue(mockBooking),
      findByIdAndUser: jest.fn().mockResolvedValue(mockBooking),
      cancelBooking: jest.fn().mockResolvedValue({ ...mockBooking, status: 'CANCELLED' }),
      findByUser: jest.fn().mockResolvedValue({ bookings: [], total: 0 }),
    };
    BookingsRepository.mockImplementation(() => mockRepo);
    service = new BookingsService();
    jest.clearAllMocks();
    BookingsRepository.mockImplementation(() => mockRepo);
    service = new BookingsService();
  });

  describe('createHold', () => {
    it('creates hold when room is available', async () => {
      prisma.roomType.findFirst.mockResolvedValue({ id: 'room-type-id', name: 'Standard' });
      mockRepo.isRoomAvailable.mockResolvedValue(true);
      mockRepo.createHold.mockResolvedValue({ id: 'hold-id' });

      const result = await service.createHold('user-id', {
        roomTypeId: 'room-type-id',
        propertyId: 'property-id',
        checkin: '2026-07-01',
        checkout: '2026-07-03',
        adults: 2,
        children: 0,
      });

      expect(result.id).toBe('hold-id');
    });

    it('throws NotFoundError when room type not found', async () => {
      prisma.roomType.findFirst.mockResolvedValue(null);

      await expect(
        service.createHold('user-id', {
          roomTypeId: 'non-existent',
          propertyId: 'property-id',
          checkin: '2026-07-01',
          checkout: '2026-07-03',
          adults: 2,
          children: 0,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws 409 ROOM_NOT_AVAILABLE when dates are blocked', async () => {
      prisma.roomType.findFirst.mockResolvedValue({ id: 'room-type-id' });
      mockRepo.isRoomAvailable.mockResolvedValue(false);

      await expect(
        service.createHold('user-id', {
          roomTypeId: 'room-type-id',
          propertyId: 'property-id',
          checkin: '2026-07-01',
          checkout: '2026-07-03',
          adults: 2,
          children: 0,
        }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'ROOM_NOT_AVAILABLE' });
    });
  });

  describe('createBooking', () => {
    it('throws 410 HOLD_EXPIRED for expired hold', async () => {
      mockRepo.findHoldById.mockResolvedValue({
        ...mockHold,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.createBooking('user-id', {
          holdId: 'hold-id',
          adults: 2,
          children: 0,
          guestDetails: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '9876543210',
            country: 'IN',
          },
          payment: {
            razorpayOrderId: 'order-id',
            razorpayPaymentId: 'pay-id',
            razorpaySignature: 'sig',
          },
        }),
      ).rejects.toMatchObject({ statusCode: 410, code: 'HOLD_EXPIRED' });
    });

    it('throws ForbiddenError when hold belongs to different user', async () => {
      mockRepo.findHoldById.mockResolvedValue({ ...mockHold, userId: 'other-user' });

      await expect(
        service.createBooking('user-id', {
          holdId: 'hold-id',
          adults: 2,
          children: 0,
          guestDetails: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '9876543210',
            country: 'IN',
          },
          payment: {
            razorpayOrderId: 'order-id',
            razorpayPaymentId: 'pay-id',
            razorpaySignature: 'sig',
          },
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('cancelBooking', () => {
    it('throws 409 BOOKING_NOT_CANCELLABLE for already-cancelled booking', async () => {
      mockRepo.findByIdAndUser.mockResolvedValue({ ...mockBooking, status: 'CANCELLED' });

      await expect(service.cancelBooking('booking-id', 'user-id'))
        .rejects.toMatchObject({ statusCode: 409, code: 'BOOKING_NOT_CANCELLABLE' });
    });

    it('cancels a confirmed booking', async () => {
      mockRepo.findByIdAndUser.mockResolvedValue(mockBooking);
      mockRepo.cancelBooking.mockResolvedValue({ ...mockBooking, status: 'CANCELLED' });

      const result = await service.cancelBooking('booking-id', 'user-id');
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('getBookingById', () => {
    it('returns the booking for the correct user', async () => {
      mockRepo.findByIdAndUser.mockResolvedValue(mockBooking);

      const result = await service.getBookingById('booking-id', 'user-id');
      expect(result.id).toBe('booking-id');
    });

    it('throws NotFoundError when booking not found', async () => {
      mockRepo.findByIdAndUser.mockResolvedValue(null);

      await expect(service.getBookingById('non-existent', 'user-id'))
        .rejects.toThrow(NotFoundError);
    });
  });
});
