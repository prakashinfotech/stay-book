import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { BookingsRepository } from './bookings.repository';
import { CreateHoldDto, CreateBookingDto } from './bookings.schema';
import { AppError, NotFoundError, ForbiddenError, PaymentError } from '../../common/errors/app-error';
import { sendBookingConfirmation } from '../../utils/email.util';
import { logger } from '../../common/utils/logger';
import { config } from '../../config/env';
import { prisma } from '../../config/prisma';

export class BookingsService {
  private readonly repo = new BookingsRepository();

  async createHold(userId: string, dto: CreateHoldDto) {
    try {
      const roomType = await prisma.roomType.findFirst({
        where: { id: dto.roomTypeId, propertyId: dto.propertyId },
      });
      if (!roomType) throw new NotFoundError('Room type not found for this property');

      const checkin = new Date(dto.checkin);
      const checkout = new Date(dto.checkout);

      const isAvailable = await this.repo.isRoomAvailable(dto.roomTypeId, checkin, checkout);
      if (!isAvailable) {
        throw new AppError(409, 'ROOM_NOT_AVAILABLE', 'Room is not available for the selected dates');
      }

      const hold = await this.repo.createHold({
        roomTypeId: dto.roomTypeId,
        propertyId: dto.propertyId,
        userId,
        checkin,
        checkout,
      });

      logger.info('Hold created', { holdId: hold.id, userId, roomTypeId: dto.roomTypeId });
      return hold;
    } catch (error) {
      logger.error('Failed to create hold', { error, userId });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'HOLD_CREATE_FAILED', 'Failed to create hold');
    }
  }

  async createBooking(userId: string, dto: CreateBookingDto) {
    try {
      const hold = await this.repo.findHoldById(dto.holdId);
      if (!hold) throw new NotFoundError('Hold not found or expired');
      if (hold.userId !== userId) throw new ForbiddenError('Hold does not belong to you');
      if (hold.expiresAt < new Date()) {
        throw new AppError(410, 'HOLD_EXPIRED', 'Hold has expired. Please search again');
      }

      const isAvailable = await this.repo.isRoomAvailable(hold.roomTypeId, hold.checkin, hold.checkout);
      if (!isAvailable) {
        throw new AppError(409, 'ROOM_NOT_AVAILABLE', 'Room is no longer available');
      }

      // Razorpay HMAC-SHA256 signature verification
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = dto.payment;
      const devBypass = config.NODE_ENV === 'development' && config.DEV_BYPASS_PAYMENT;

      if (!devBypass) {
        const expectedSig = crypto
          .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
          .update(`${razorpayOrderId}|${razorpayPaymentId}`)
          .digest('hex');

        const sigBuffer = Buffer.from(razorpaySignature, 'hex');
        const expectedBuffer = Buffer.from(expectedSig, 'hex');

        let signatureValid = false;
        if (sigBuffer.length === expectedBuffer.length) {
          signatureValid = crypto.timingSafeEqual(sigBuffer, expectedBuffer);
        }

        if (!signatureValid) {
          logger.warn('Razorpay signature verification failed', {
            razorpayOrderId,
            razorpayPaymentId,
            userId,
          });
          throw new PaymentError('Payment verification failed. Please contact support.');
        }

        logger.info('Razorpay signature verified', { razorpayOrderId, razorpayPaymentId, userId });
      } else {
        logger.warn('DEV_BYPASS_PAYMENT: skipping Razorpay signature verification', { userId });
      }

      let ratePlan = dto.ratePlanId
        ? hold.roomType.ratePlans.find((rp) => rp.id === dto.ratePlanId)
        : hold.roomType.ratePlans.find((rp) => rp.planType === 'STANDARD') ??
          hold.roomType.ratePlans[0];

      if (!ratePlan) {
        // Room type was created before rate-plan auto-creation was added — backfill a STANDARD plan
        ratePlan = await prisma.ratePlan.create({
          data: { roomTypeId: hold.roomTypeId, planType: 'STANDARD', discountPercent: 0, minNights: 1 },
        });
        logger.warn('Auto-created missing STANDARD rate plan', { roomTypeId: hold.roomTypeId });
      }

      const nights = Math.ceil(
        (hold.checkout.getTime() - hold.checkin.getTime()) / (1000 * 60 * 60 * 24),
      );
      const basePrice = Number(hold.roomType.basePrice);
      const discount = Number(ratePlan.discountPercent) / 100;
      const totalPrice = new Prisma.Decimal((basePrice * nights * (1 - discount)).toFixed(2));

      const confirmationNumber = `BK${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const pin = Math.floor(1000 + Math.random() * 9000).toString();

      const booking = await this.repo.createBookingWithTransaction({
        userId,
        propertyId: hold.propertyId,
        roomTypeId: hold.roomTypeId,
        ratePlanId: ratePlan.id,
        checkin: hold.checkin,
        checkout: hold.checkout,
        adults: dto.adults,
        children: dto.children,
        totalPrice,
        confirmationNumber,
        pin,
        paymentTransactionId: razorpayPaymentId,
        guestName: `${dto.guestDetails.firstName} ${dto.guestDetails.lastName}`,
        guestEmail: dto.guestDetails.email,
        guestPhone: dto.guestDetails.phone,
        guestCountry: dto.guestDetails.country,
        specialRequests: dto.guestDetails.specialRequests,
        arrivalTime: dto.guestDetails.arrivalTime,
        holdId: dto.holdId,
        razorpayOrderId,
      });

      logger.info('Booking created', { bookingId: booking.id, userId, confirmationNumber });

      const property = await prisma.property.findUnique({
        where: { id: hold.propertyId },
        select: { name: true },
      });

      await sendBookingConfirmation({
        to: dto.guestDetails.email,
        guestName: `${dto.guestDetails.firstName} ${dto.guestDetails.lastName}`,
        confirmationNumber,
        pin,
        propertyName: property?.name ?? '',
        checkin: hold.checkin.toISOString().split('T')[0],
        checkout: hold.checkout.toISOString().split('T')[0],
        totalPrice: Number(totalPrice),
      });

      return booking;
    } catch (error) {
      logger.error('Failed to create booking', { error, userId });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'BOOKING_CREATE_FAILED', 'Failed to create booking');
    }
  }

  async getMyBookings(userId: string, page: number, limit: number) {
    const { bookings, total } = await this.repo.findByUser(userId, page, limit);
    return { data: bookings, total, page, limit };
  }

  async getBookingById(bookingId: string, userId: string) {
    const booking = await this.repo.findByIdAndUser(bookingId, userId);
    if (!booking) throw new NotFoundError('Booking not found');
    return booking;
  }

  async cancelBooking(bookingId: string, userId: string) {
    try {
      const booking = await this.repo.findByIdAndUser(bookingId, userId);
      if (!booking) throw new NotFoundError('Booking not found');
      if (booking.status !== 'CONFIRMED') {
        throw new AppError(409, 'BOOKING_NOT_CANCELLABLE', 'Only confirmed bookings can be cancelled');
      }

      const cancelled = await this.repo.cancelBooking(
        bookingId,
        booking.roomTypeId,
        booking.checkin,
        booking.checkout,
      );

      logger.info('Booking cancelled', { bookingId, userId });
      return cancelled;
    } catch (error) {
      logger.error('Failed to cancel booking', { error, bookingId, userId });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'BOOKING_CANCEL_FAILED', 'Failed to cancel booking');
    }
  }
}
