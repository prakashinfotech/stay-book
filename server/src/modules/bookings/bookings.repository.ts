import { Prisma, BookingStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class BookingsRepository {
  async findHoldById(holdId: string) {
    return prisma.availabilityHold.findUnique({
      where: { id: holdId },
      include: { roomType: { include: { ratePlans: true } } },
    });
  }

  async isRoomAvailable(roomTypeId: string, checkinDate: Date, checkoutDate: Date): Promise<boolean> {
    const blocked = await prisma.availability.findFirst({
      where: {
        roomTypeId,
        date: { gte: checkinDate, lt: checkoutDate },
        isBlocked: true,
      },
    });
    return blocked === null;
  }

  async createHold(data: {
    roomTypeId: string;
    propertyId: string;
    userId: string;
    checkin: Date;
    checkout: Date;
  }) {
    const ttlMs = process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + ttlMs);
    return prisma.availabilityHold.create({ data: { ...data, expiresAt } });
  }

  async createBookingWithTransaction(data: {
    userId: string;
    propertyId: string;
    roomTypeId: string;
    ratePlanId: string;
    checkin: Date;
    checkout: Date;
    adults: number;
    children: number;
    totalPrice: Prisma.Decimal;
    confirmationNumber: string;
    pin: string;
    paymentTransactionId: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    guestCountry: string;
    specialRequests?: string;
    arrivalTime?: string;
    holdId: string;
    razorpayOrderId: string;
  }) {
    const dates = getDatesInRange(data.checkin, data.checkout);

    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          userId: data.userId,
          propertyId: data.propertyId,
          roomTypeId: data.roomTypeId,
          ratePlanId: data.ratePlanId,
          checkin: data.checkin,
          checkout: data.checkout,
          adults: data.adults,
          children: data.children,
          totalPrice: data.totalPrice,
          confirmationNumber: data.confirmationNumber,
          pin: data.pin,
          paymentTransactionId: data.paymentTransactionId,
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          guestPhone: data.guestPhone,
          guestCountry: data.guestCountry,
          specialRequests: data.specialRequests,
          arrivalTime: data.arrivalTime,
        },
      });

      await Promise.all(
        dates.map((date) =>
          tx.availability.upsert({
            where: { roomTypeId_date: { roomTypeId: data.roomTypeId, date } },
            create: {
              propertyId: data.propertyId,
              roomTypeId: data.roomTypeId,
              date,
              isBlocked: true,
              bookingId: booking.id,
            },
            update: { isBlocked: true, bookingId: booking.id },
          }),
        ),
      );

      await tx.availabilityHold.delete({ where: { id: data.holdId } });

      await tx.paymentSimulation.create({
        data: {
          bookingId: booking.id,
          transactionId: data.paymentTransactionId,
          cardholderName: data.razorpayOrderId,
          cardLastFour: 'RZPY',
          simulatedFailure: false,
          success: true,
        },
      });

      return booking;
    });
  }

  async findByIdAndUser(bookingId: string, userId: string) {
    return prisma.booking.findFirst({
      where: { id: bookingId, userId },
      include: {
        property: { select: { id: true, name: true, city: true, address: true } },
        roomType: { select: { id: true, name: true, cancellationPolicy: true } },
      },
    });
  }

  async cancelBooking(bookingId: string, roomTypeId: string, checkin: Date, checkout: Date) {
    const dates = getDatesInRange(checkin, checkout);

    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED, cancelledAt: new Date() },
      });

      await tx.availability.updateMany({
        where: { roomTypeId, date: { in: dates }, bookingId },
        data: { isBlocked: false, bookingId: null },
      });

      return booking;
    });
  }

  async findByUser(userId: string, page: number, limit: number) {
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { userId },
        include: {
          property: { select: { id: true, name: true, city: true } },
          roomType: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where: { userId } }),
    ]);
    return { bookings, total };
  }
}

function getDatesInRange(checkin: Date, checkout: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(checkin);
  while (current < checkout) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}
