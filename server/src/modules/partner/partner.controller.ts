import { Request, Response, NextFunction } from 'express';
import { ok } from '../../common/utils/response';
import { PartnerService } from './partner.service';

const service = new PartnerService();

export class PartnerController {
  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { ok(res, await service.getSummary(req.user!.id)); } catch (e) { next(e); }
  };

  getProperties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { ok(res, await service.getProperties(req.user!.id)); } catch (e) { next(e); }
  };

  getUpcomingArrivals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { ok(res, await service.getUpcomingArrivals(req.user!.id)); } catch (e) { next(e); }
  };

  getBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as string | undefined;
      const page   = Math.max(1, Number(req.query.page  ?? 1));
      const limit  = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
      ok(res, await service.getBookings(req.user!.id, status, page, limit));
    } catch (e) { next(e); }
  };

  markNoShow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { ok(res, await service.markNoShow(req.params.id, req.user!.id), 'Booking marked as no-show'); } catch (e) { next(e); }
  };

  getEarnings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { ok(res, await service.getEarnings(req.user!.id)); } catch (e) { next(e); }
  };

  getAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { propertyId } = req.params;
      const year  = Number(req.query.year  ?? new Date().getFullYear());
      const month = Number(req.query.month ?? new Date().getMonth() + 1);
      ok(res, await service.getAvailability(propertyId, req.user!.id, year, month));
    } catch (e) { next(e); }
  };

  updateAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { propertyId } = req.params;
      const { dates } = req.body as { dates: { date: string; roomTypeId: string; isBlocked: boolean }[] };
      await service.updateAvailability(propertyId, req.user!.id, dates);
      ok(res, null, 'Availability updated');
    } catch (e) { next(e); }
  };

  getLegal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      ok(res, await service.getLegal(req.params.propertyId));
    } catch (e) { next(e); }
  };

  upsertLegal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const legal = await service.upsertLegal(req.params.propertyId, req.body);
      ok(res, legal, 'KYC submitted for review');
    } catch (e) { next(e); }
  };

  approveBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      ok(res, await service.approveBooking(req.params.id, req.user!.id), 'Booking approved');
    } catch (e) { next(e); }
  };

  declineBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reason } = req.body as { reason: string };
      ok(res, await service.declineBooking(req.params.id, req.user!.id, reason), 'Booking declined');
    } catch (e) { next(e); }
  };
}
