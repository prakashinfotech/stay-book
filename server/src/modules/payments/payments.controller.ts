import { Request, Response, NextFunction } from 'express';
import { PaymentsService } from './payments.service';
import { created } from '../../common/utils/response';

export class PaymentsController {
  private readonly service = new PaymentsService();

  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.service.createOrder(req.user!.id, req.body);
      created(res, order);
    } catch (error) {
      next(error);
    }
  };
}
