import { Request, Response, NextFunction } from 'express';
import { PropertiesService } from './properties.service';
import { ok, created } from '../../common/utils/response';

export class PropertiesController {
  private readonly service = new PropertiesService();

  getFeatured = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const properties = await this.service.getFeatured();
      ok(res, properties);
    } catch (error) {
      next(error);
    }
  };

  getAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { year, month } = req.query;
      const availability = await this.service.getAvailability(
        req.params.id,
        Number(year) || new Date().getFullYear(),
        Number(month) || new Date().getMonth() + 1,
      );
      ok(res, availability);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const property = await this.service.getById(req.params.id);
      ok(res, property);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const property = await this.service.create(req.user!.id, req.body);
      created(res, property);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const property = await this.service.update(req.params.id, req.user!.id, req.body);
      ok(res, property);
    } catch (error) {
      next(error);
    }
  };

  publish = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const property = await this.service.publish(req.params.id, req.user!.id);
      ok(res, property);
    } catch (error) {
      next(error);
    }
  };

  addRoomType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomType = await this.service.addRoomType(req.params.id, req.user!.id, req.body);
      created(res, roomType);
    } catch (error) {
      next(error);
    }
  };

  addImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.addImages(req.params.id, req.user!.id, req.body);
      created(res, result);
    } catch (error) {
      next(error);
    }
  };

  getRatePlans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plans = await this.service.getRatePlans(req.params.id, req.params.roomTypeId, req.user!.id);
      ok(res, plans);
    } catch (error) {
      next(error);
    }
  };

  createRatePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plan = await this.service.createRatePlan(req.params.id, req.params.roomTypeId, req.user!.id, req.body);
      created(res, plan);
    } catch (error) {
      next(error);
    }
  };

  deleteRatePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteRatePlan(req.params.id, req.params.roomTypeId, req.params.ratePlanId, req.user!.id);
      ok(res, { message: 'Rate plan deleted' });
    } catch (error) {
      next(error);
    }
  };
}
