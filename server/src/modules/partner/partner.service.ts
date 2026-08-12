import { AppError } from '../../common/errors/app-error';
import { logger } from '../../common/utils/logger';
import { PartnerRepository } from './partner.repository';
import { UpsertLegalDto } from './partner-legal.schema';

const repo = new PartnerRepository();

const SUMMARY_TTL_MS = 30_000;
const summaryCache = new Map<string, { data: unknown; expiresAt: number }>();

function invalidateSummary(ownerId: string): void {
  summaryCache.delete(ownerId);
}

export class PartnerService {
  async getSummary(ownerId: string) {
    const cached = summaryCache.get(ownerId);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    try {
      const data = await repo.getSummary(ownerId);
      summaryCache.set(ownerId, { data, expiresAt: Date.now() + SUMMARY_TTL_MS });
      return data;
    } catch (e) { this.rethrow(e, 'SUMMARY_FAILED', 'Failed to load summary', { ownerId }); }
  }

  async getProperties(ownerId: string) {
    try { return await repo.getProperties(ownerId); }
    catch (e) { this.rethrow(e, 'PROPERTIES_FAILED', 'Failed to load properties', { ownerId }); }
  }

  async getUpcomingArrivals(ownerId: string) {
    try { return await repo.getUpcomingArrivals(ownerId); }
    catch (e) { this.rethrow(e, 'ARRIVALS_FAILED', 'Failed to load arrivals', { ownerId }); }
  }

  async getBookings(ownerId: string, status: string | undefined, page: number, limit: number) {
    try { return await repo.getBookings(ownerId, status, page, limit); }
    catch (e) { this.rethrow(e, 'BOOKINGS_FAILED', 'Failed to load bookings', { ownerId }); }
  }

  async markNoShow(bookingId: string, ownerId: string) {
    try {
      const booking = await repo.markNoShow(bookingId, ownerId);
      invalidateSummary(ownerId);
      logger.info('Booking marked no-show', { bookingId, ownerId });
      return booking;
    } catch (e) { this.rethrow(e, 'NOSHOW_FAILED', 'Failed to update booking', { bookingId, ownerId }); }
  }

  async getEarnings(ownerId: string) {
    try { return await repo.getEarnings(ownerId); }
    catch (e) { this.rethrow(e, 'EARNINGS_FAILED', 'Failed to load earnings', { ownerId }); }
  }

  async getAvailability(propertyId: string, ownerId: string, year: number, month: number) {
    try { return await repo.getAvailabilityForMonth(propertyId, ownerId, year, month); }
    catch (e) { this.rethrow(e, 'AVAILABILITY_FAILED', 'Failed to load availability', { propertyId, ownerId }); }
  }

  async updateAvailability(
    propertyId: string,
    ownerId: string,
    dates: { date: string; roomTypeId: string; isBlocked: boolean }[],
  ) {
    try {
      await repo.updateAvailability(propertyId, ownerId, dates);
      invalidateSummary(ownerId);
      logger.info('Availability updated', { propertyId, ownerId, count: dates.length });
    } catch (e) { this.rethrow(e, 'AVAILABILITY_UPDATE_FAILED', 'Failed to update availability', { propertyId, ownerId }); }
  }

  async getLegal(propertyId: string) {
    try { return await repo.getLegal(propertyId); }
    catch (e) { this.rethrow(e, 'GET_LEGAL_FAILED', 'Failed to load KYC', { propertyId }); }
  }

  async upsertLegal(propertyId: string, dto: UpsertLegalDto) {
    try {
      const legal = await repo.upsertLegal(propertyId, dto);
      logger.info('KYC submitted', { propertyId, entityType: dto.entityType });
      return legal;
    } catch (e) { this.rethrow(e, 'UPSERT_LEGAL_FAILED', 'Failed to submit KYC', { propertyId }); }
  }

  async approveBooking(bookingId: string, ownerId: string) {
    try {
      const booking = await repo.approveBooking(bookingId, ownerId);
      invalidateSummary(ownerId);
      logger.info('Booking approved', { bookingId, ownerId });
      return booking;
    } catch (e) { this.rethrow(e, 'APPROVE_BOOKING_FAILED', 'Failed to approve booking', { bookingId, ownerId }); }
  }

  async declineBooking(bookingId: string, ownerId: string, reason: string) {
    try {
      const booking = await repo.declineBooking(bookingId, ownerId, reason);
      invalidateSummary(ownerId);
      logger.info('Booking declined', { bookingId, ownerId, reason });
      return booking;
    } catch (e) { this.rethrow(e, 'DECLINE_BOOKING_FAILED', 'Failed to decline booking', { bookingId, ownerId }); }
  }

  private rethrow(e: unknown, code: string, message: string, ctx: Record<string, unknown>): never {
    logger.error(message, { error: e, ...ctx });
    if (e instanceof AppError) throw e;
    throw new AppError(500, code, message);
  }
}
