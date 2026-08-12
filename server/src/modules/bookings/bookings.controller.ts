import { Request, Response, NextFunction } from 'express';
import { BookingsService } from './bookings.service';
import { listBookingsQuerySchema } from './bookings.schema';
import { ok, created, paginated } from '../../common/utils/response';

export class BookingsController {
  private readonly service = new BookingsService();

  createHold = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hold = await this.service.createHold(req.user!.id, req.body);
      created(res, hold);
    } catch (error) {
      next(error);
    }
  };

  createBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const booking = await this.service.createBooking(req.user!.id, req.body);
      created(res, booking);
    } catch (error) {
      next(error);
    }
  };

  getMyBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = listBookingsQuerySchema.parse(req.query);
      const result = await this.service.getMyBookings(req.user!.id, parsed.page, parsed.limit);
      paginated(res, result.data, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  };

  getBookingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const booking = await this.service.getBookingById(req.params.id, req.user!.id);
      ok(res, booking);
    } catch (error) {
      next(error);
    }
  };

  cancelBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const booking = await this.service.cancelBooking(req.params.id, req.user!.id);
      ok(res, booking);
    } catch (error) {
      next(error);
    }
  };
}
