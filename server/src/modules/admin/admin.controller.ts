import { Request, Response, NextFunction } from 'express';
import { ok } from '../../common/utils/response';
import { AdminService } from './admin.service';
import { Role } from '@prisma/client';

const service = new AdminService();

export class AdminController {
  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { ok(res, await service.getStats()); } catch (e) { next(e); }
  };

  getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role  = req.query.role  as string | undefined;
      const search = req.query.q as string | undefined;
      const page  = Math.max(1, Number(req.query.page  ?? 1));
      const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
      ok(res, await service.getUsers(role, page, limit, search));
    } catch (e) { next(e); }
  };

  getProperties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as string | undefined;
      const search = req.query.q as string | undefined;
      const page   = Math.max(1, Number(req.query.page  ?? 1));
      const limit  = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
      ok(res, await service.getProperties(status, page, limit, search));
    } catch (e) { next(e); }
  };

  getBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as string | undefined;
      const search = req.query.q as string | undefined;
      const page   = Math.max(1, Number(req.query.page  ?? 1));
      const limit  = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
      ok(res, await service.getBookings(status, page, limit, search));
    } catch (e) { next(e); }
  };

  updatePropertyStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.body as { status: string };
      ok(res, await service.updatePropertyStatus(req.params.id, status), 'Status updated');
    } catch (e) { next(e); }
  };

  getPendingProperties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.q as string | undefined;
      const page   = Math.max(1, Number(req.query.page  ?? 1));
      const limit  = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
      ok(res, await service.getPendingProperties(page, limit, search));
    } catch (e) { next(e); }
  };

  approveProperty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { note } = req.body as { note?: string };
      ok(res, await service.approveProperty(req.user!.id, req.params.id, note), 'Property approved');
    } catch (e) { next(e); }
  };

  rejectProperty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reason } = req.body as { reason: string };
      ok(res, await service.rejectProperty(req.user!.id, req.params.id, reason), 'Property rejected');
    } catch (e) { next(e); }
  };

  updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { role } = req.body as { role: string };
      ok(res, await service.updateUserRole(req.user!.id, req.params.id, role as Role), 'User role updated');
    } catch (e) { next(e); }
  };

  deactivateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      ok(res, await service.deactivateUser(req.user!.id, req.params.id), 'User deactivated');
    } catch (e) { next(e); }
  };

  restoreUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      ok(res, await service.restoreUser(req.user!.id, req.params.id), 'User restored');
    } catch (e) { next(e); }
  };

  updateBookingStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.body as { status: string };
      ok(res, await service.updateBookingStatus(req.user!.id, req.params.id, status), 'Booking status updated');
    } catch (e) { next(e); }
  };

  getAllKyc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const kycStatus = req.query.kycStatus as string | undefined;
      const search = req.query.q as string | undefined;
      const page   = Math.max(1, Number(req.query.page  ?? 1));
      const limit  = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
      ok(res, await service.getAllKyc(page, limit, kycStatus, search));
    } catch (e) { next(e); }
  };

  getKycById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      ok(res, await service.getKycById(req.params.id));
    } catch (e) { next(e); }
  };

  approveKyc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { note } = req.body as { note?: string };
      ok(res, await service.approveKyc(req.user!.id, req.params.id, note), 'KYC approved');
    } catch (e) { next(e); }
  };

  rejectKyc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reason } = req.body as { reason: string };
      ok(res, await service.rejectKyc(req.user!.id, req.params.id, reason), 'KYC rejected');
    } catch (e) { next(e); }
  };

  getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const entityType = req.query.entityType as string | undefined;
      const page   = Math.max(1, Number(req.query.page  ?? 1));
      const limit  = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
      ok(res, await service.getAuditLogs(page, limit, entityType));
    } catch (e) { next(e); }
  };
}
