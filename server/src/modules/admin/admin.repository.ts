import { BookingStatus, PropertyStatus, Role, KycStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../common/errors/app-error';

export class AdminRepository {
  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalProperties,
      activeProperties,
      totalBookings,
      confirmedBookings,
      pendingPropertyCount,
      pendingKycCount,
      revenueThisMonth,
      revenueLifetime,
      recentBookings,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.property.count(),
      prisma.property.count({ where: { status: PropertyStatus.ACTIVE } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
      prisma.property.count({ where: { status: PropertyStatus.PENDING_REVIEW } }),
      prisma.partnerLegal.count({ where: { kycStatus: KycStatus.KYC_PENDING } }),
      prisma.booking.aggregate({
        where: {
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
          createdAt: { gte: startOfMonth },
        },
        _sum: { totalPrice: true },
      }),
      prisma.booking.aggregate({
        where: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } },
        _sum: { totalPrice: true },
      }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { name: true, city: true } },
          roomType: { select: { name: true } },
        },
      }),
    ]);

    return {
      totalUsers,
      totalProperties,
      activeProperties,
      totalBookings,
      confirmedBookings,
      pendingPropertyCount,
      pendingKycCount,
      revenueThisMonth: Number(revenueThisMonth._sum.totalPrice ?? 0),
      revenueLifetime: Number(revenueLifetime._sum.totalPrice ?? 0),
      recentBookings,
    };
  }

  async getUsers(role: string | undefined, page: number, limit: number, search?: string) {
    const where: any = { deletedAt: null };
    if (role && role !== 'ALL') where.role = role as Role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          emailVerified: true,
          deletedAt: true,
          createdAt: true,
          _count: { select: { bookings: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getProperties(status: string | undefined, page: number, limit: number, search?: string) {
    const where: any = {};
    if (status && status !== 'ALL') where.status = status as PropertyStatus;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          owner: { select: { id: true, email: true, firstName: true, lastName: true } },
          images: { take: 1, orderBy: { sortOrder: 'asc' } },
          _count: { select: { bookings: true, roomTypes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getBookings(status: string | undefined, page: number, limit: number, search?: string) {
    const where: any = {};
    if (status && status !== 'ALL') where.status = status as BookingStatus;
    if (search) {
      where.OR = [
        { guestName: { contains: search, mode: 'insensitive' } },
        { guestEmail: { contains: search, mode: 'insensitive' } },
        { confirmationNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          property: { select: { id: true, name: true, city: true } },
          roomType: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPropertyById(id: string) {
    return prisma.property.findUnique({
      where: { id },
      include: {
        owner: true,
        partnerLegal: true,
      },
    });
  }

  async updatePropertyStatus(propertyId: string, status: PropertyStatus) {
    const property = await this.getPropertyById(propertyId);
    if (!property) throw new NotFoundError(`Property ${propertyId} not found`);
    return prisma.property.update({
      where: { id: propertyId },
      data: { status },
    });
  }

  async approveProperty(propertyId: string, adminId: string, note?: string) {
    return prisma.property.update({
      where: { id: propertyId },
      data: {
        status: PropertyStatus.ACTIVE,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
    });
  }

  async rejectProperty(propertyId: string, adminId: string, reason: string) {
    return prisma.property.update({
      where: { id: propertyId },
      data: {
        status: PropertyStatus.DRAFT,
        rejectionReason: reason,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
    });
  }

  async getPendingProperties(page: number, limit: number, search?: string) {
    const where: any = { status: PropertyStatus.PENDING_REVIEW };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          owner: { select: { id: true, email: true, firstName: true, lastName: true } },
          images: { take: 1, orderBy: { sortOrder: 'asc' } },
          _count: { select: { bookings: true, roomTypes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        deletedAt: true,
      },
    });
  }

  async updateUserRole(userId: string, role: Role) {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  async deactivateUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
  }

  async restoreUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
    });
  }

  async getBookingById(id: string) {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        property: true,
        roomType: true,
      },
    });
  }

  async updateBookingStatus(bookingId: string, status: BookingStatus) {
    return prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }

  async getAllKyc(page: number, limit: number, kycStatus?: string, search?: string) {
    const where: any = {};
    if (kycStatus && kycStatus !== 'ALL') where.kycStatus = kycStatus as KycStatus;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { property: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.partnerLegal.findMany({
        where,
        include: {
          property: {
            select: { id: true, name: true, city: true, owner: { select: { email: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.partnerLegal.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getKycById(id: string) {
    return prisma.partnerLegal.findUnique({
      where: { id },
      include: {
        property: {
          include: { owner: true },
        },
      },
    });
  }

  async getKycByPropertyId(propertyId: string) {
    return prisma.partnerLegal.findUnique({ where: { propertyId } });
  }

  async approveKyc(kycId: string, adminId: string, note?: string) {
    return prisma.partnerLegal.update({
      where: { id: kycId },
      data: {
        kycStatus: KycStatus.KYC_APPROVED,
        kycReviewedAt: new Date(),
        kycReviewedBy: adminId,
      },
    });
  }

  async rejectKyc(kycId: string, adminId: string, reason: string) {
    return prisma.partnerLegal.update({
      where: { id: kycId },
      data: {
        kycStatus: KycStatus.KYC_REJECTED,
        kycRejectionReason: reason,
        kycReviewedAt: new Date(),
        kycReviewedBy: adminId,
      },
    });
  }

  async getAuditLogs(page: number, limit: number, entityType?: string) {
    const where: any = {};
    if (entityType && entityType !== 'ALL') where.entityType = entityType;
    const [data, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        include: {
          admin: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adminAuditLog.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createAuditLog(adminId: string, action: string, entityType: string, entityId: string, note?: string, metadata?: any) {
    return prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId,
        note,
        metadata,
      },
    });
  }
}
