import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { updateUserSchema } from './users.schema';
import { ok } from '../../common/utils/response';

export class UsersController {
  private readonly usersService = new UsersService();

  findOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.usersService.findById(req.params.id);
      ok(res, user);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = updateUserSchema.parse(req.body);
      const user = await this.usersService.update(req.params.id, dto);
      ok(res, user, 'Updated');
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.usersService.remove(req.params.id);
      ok(res, null, 'Deleted');
    } catch (error) {
      next(error);
    }
  };
}
