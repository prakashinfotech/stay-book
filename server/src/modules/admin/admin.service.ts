import { PropertyStatus, Role } from '@prisma/client';
import { AppError, BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../common/errors/app-error';
import { logger } from '../../common/utils/logger';
import { AdminRepository } from './admin.repository';

const repo = new AdminRepository();

export class AdminService {
  async getStats() {
    try { return await repo.getStats(); }
    catch (e) { this.rethrow(e, 'STATS_FAILED', 'Failed to load stats'); }
  }

  async getUsers(role: string | undefined, page: number, limit: number, search?: string) {
    try { return await repo.getUsers(role, page, limit, search); }
    catch (e) { this.rethrow(e, 'USERS_FAILED', 'Failed to load users'); }
  }

  async getProperties(status: string | undefined, page: number, limit: number, search?: string) {
    try { return await repo.getProperties(status, page, limit, search); }
    catch (e) { this.rethrow(e, 'PROPERTIES_FAILED', 'Failed to load properties'); }
  }

  async getBookings(status: string | undefined, page: number, limit: number, search?: string) {
    try { return await repo.getBookings(status, page, limit, search); }
    catch (e) { this.rethrow(e, 'BOOKINGS_FAILED', 'Failed to load bookings'); }
  }

  async updatePropertyStatus(propertyId: string, status: string) {
    try {
      const prop = await repo.updatePropertyStatus(propertyId, status as PropertyStatus);
      logger.info('Property status updated by admin', { propertyId, status });
      return prop;
    } catch (e) { this.rethrow(e, 'STATUS_UPDATE_FAILED', 'Failed to update property status'); }
  }

  async getPendingProperties(page: number, limit: number, search?: string) {
    try { return await repo.getPendingProperties(page, limit, search); }
    catch (e) { this.rethrow(e, 'PENDING_PROPERTIES_FAILED', 'Failed to load pending properties'); }
  }

  async approveProperty(actorId: string, propertyId: string, note?: string) {
    try {
      const property = await repo.getPropertyById(propertyId);
      if (!property) throw new NotFoundError(`Property ${propertyId} not found`);
      if (property.status !== PropertyStatus.PENDING_REVIEW) {
        throw new BadRequestError('Property is not pending review');
      }
      const kyc = await repo.getKycByPropertyId(propertyId);
      if (!kyc || kyc.kycStatus !== 'KYC_APPROVED') {
        throw new BadRequestError('Partner KYC must be approved before property can be activated');
      }
      const approved = await repo.approveProperty(propertyId, actorId, note);
      await repo.createAuditLog(actorId, 'APPROVE_PROPERTY', 'PROPERTY', propertyId, note);
      logger.info('Property approved', { propertyId, adminId: actorId });
      return approved;
    } catch (e) { this.rethrow(e, 'APPROVE_PROPERTY_FAILED', 'Failed to approve property'); }
  }

  async rejectProperty(actorId: string, propertyId: string, reason: string) {
    try {
      const property = await repo.getPropertyById(propertyId);
      if (!property) throw new NotFoundError(`Property ${propertyId} not found`);
      if (property.status !== PropertyStatus.PENDING_REVIEW) {
        throw new BadRequestError('Property is not pending review');
      }
      const rejected = await repo.rejectProperty(propertyId, actorId, reason);
      await repo.createAuditLog(actorId, 'REJECT_PROPERTY', 'PROPERTY', propertyId, reason);
      logger.info('Property rejected', { propertyId, adminId: actorId, reason });
      return rejected;
    } catch (e) { this.rethrow(e, 'REJECT_PROPERTY_FAILED', 'Failed to reject property'); }
  }

  async updateUserRole(actorId: string, userId: string, role: Role) {
    try {
      if (actorId === userId) throw new ForbiddenError('Cannot change your own role');
      const user = await repo.getUserById(userId);
      if (!user) throw new NotFoundError(`User ${userId} not found`);
      const updated = await repo.updateUserRole(userId, role);
      await repo.createAuditLog(actorId, 'UPDATE_USER_ROLE', 'USER', userId, undefined, { newRole: role });
      logger.info('User role updated by admin', { userId, newRole: role, adminId: actorId });
      return updated;
    } catch (e) { this.rethrow(e, 'UPDATE_ROLE_FAILED', 'Failed to update user role'); }
  }

  async deactivateUser(actorId: string, userId: string) {
    try {
      if (actorId === userId) throw new ForbiddenError('Cannot deactivate yourself');
      const user = await repo.getUserById(userId);
      if (!user) throw new NotFoundError(`User ${userId} not found`);
      if (user.role === 'ADMIN') throw new ForbiddenError('Cannot deactivate another admin');
      const deactivated = await repo.deactivateUser(userId);
      await repo.createAuditLog(actorId, 'DEACTIVATE_USER', 'USER', userId);
      logger.info('User deactivated', { userId, adminId: actorId });
      return deactivated;
    } catch (e) { this.rethrow(e, 'DEACTIVATE_FAILED', 'Failed to deactivate user'); }
  }

  async restoreUser(actorId: string, userId: string) {
    try {
      const user = await repo.getUserById(userId);
      if (!user) throw new NotFoundError(`User ${userId} not found`);
      const restored = await repo.restoreUser(userId);
      await repo.createAuditLog(actorId, 'RESTORE_USER', 'USER', userId);
      logger.info('User restored', { userId, adminId: actorId });
      return restored;
    } catch (e) { this.rethrow(e, 'RESTORE_FAILED', 'Failed to restore user'); }
  }

  async updateBookingStatus(actorId: string, bookingId: string, status: string) {
    try {
      const booking = await repo.getBookingById(bookingId);
      if (!booking) throw new NotFoundError(`Booking ${bookingId} not found`);
      if (booking.status !== 'CONFIRMED') {
        throw new BadRequestError('Can only update status for confirmed bookings');
      }
      const updated = await repo.updateBookingStatus(bookingId, status as any);
      await repo.createAuditLog(actorId, 'UPDATE_BOOKING_STATUS', 'BOOKING', bookingId, undefined, { newStatus: status });
      logger.info('Booking status updated by admin', { bookingId, newStatus: status, adminId: actorId });
      return updated;
    } catch (e) { this.rethrow(e, 'UPDATE_BOOKING_STATUS_FAILED', 'Failed to update booking status'); }
  }

  async getAllKyc(page: number, limit: number, kycStatus?: string, search?: string) {
    try { return await repo.getAllKyc(page, limit, kycStatus, search); }
    catch (e) { this.rethrow(e, 'GET_KYC_FAILED', 'Failed to load KYC submissions'); }
  }

  async getKycById(id: string) {
    try {
      const kyc = await repo.getKycById(id);
      if (!kyc) throw new NotFoundError(`KYC ${id} not found`);
      return kyc;
    } catch (e) { this.rethrow(e, 'GET_KYC_DETAIL_FAILED', 'Failed to load KYC details'); }
  }

  async approveKyc(actorId: string, kycId: string, note?: string) {
    try {
      const kyc = await repo.getKycById(kycId);
      if (!kyc) throw new NotFoundError(`KYC ${kycId} not found`);
      if (kyc.kycStatus !== 'KYC_PENDING') throw new BadRequestError('KYC is not pending');
      const approved = await repo.approveKyc(kycId, actorId, note);
      await repo.createAuditLog(actorId, 'APPROVE_KYC', 'KYC', kycId, note);
      logger.info('KYC approved', { kycId, adminId: actorId });
      return approved;
    } catch (e) { this.rethrow(e, 'APPROVE_KYC_FAILED', 'Failed to approve KYC'); }
  }

  async rejectKyc(actorId: string, kycId: string, reason: string) {
    try {
      const kyc = await repo.getKycById(kycId);
      if (!kyc) throw new NotFoundError(`KYC ${kycId} not found`);
      if (kyc.kycStatus !== 'KYC_PENDING') throw new BadRequestError('KYC is not pending');
      const rejected = await repo.rejectKyc(kycId, actorId, reason);
      await repo.createAuditLog(actorId, 'REJECT_KYC', 'KYC', kycId, reason);
      if (kyc.property.status === PropertyStatus.ACTIVE) {
        await repo.updatePropertyStatus(kyc.propertyId, PropertyStatus.PAUSED);
        await repo.createAuditLog(actorId, 'PAUSE_PROPERTY', 'PROPERTY', kyc.propertyId, `Auto-paused due to KYC rejection: ${reason}`);
        logger.warn('Property auto-paused due to KYC rejection', { propertyId: kyc.propertyId, kycId, reason });
      }
      logger.info('KYC rejected', { kycId, adminId: actorId, reason });
      return rejected;
    } catch (e) { this.rethrow(e, 'REJECT_KYC_FAILED', 'Failed to reject KYC'); }
  }

  async getAuditLogs(page: number, limit: number, entityType?: string) {
    try { return await repo.getAuditLogs(page, limit, entityType); }
    catch (e) { this.rethrow(e, 'GET_AUDIT_LOGS_FAILED', 'Failed to load audit logs'); }
  }

  private rethrow(e: unknown, code: string, message: string): never {
    logger.error(message, { error: e });
    if (e instanceof AppError) throw e;
    throw new AppError(500, code, message);
  }
}
