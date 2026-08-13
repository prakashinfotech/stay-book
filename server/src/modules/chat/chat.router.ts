import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../common/middleware/validate.middleware';
import { askSchema } from './chat.schema';
import { ChatController } from './chat.controller';

const router = Router();
const controller = new ChatController();

const chatLimiter = rateLimit({ windowMs: 60_000, max: 30 });

router.post('/ask', chatLimiter, validate(askSchema), controller.ask);

export { router as chatRouter };
