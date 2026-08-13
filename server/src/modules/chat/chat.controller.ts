import { Request, Response, NextFunction } from 'express';
import { ChatService } from './chat.service';
import { ok } from '../../common/utils/response';

export class ChatController {
  private readonly service = new ChatService();

  ask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reply = await this.service.ask(req.body);
      ok(res, { reply });
    } catch (error) {
      next(error);
    }
  };
}
