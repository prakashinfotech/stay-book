import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/roles.middleware';
import { validate } from '../../common/middleware/validate.middleware';
import { createOrderSchema } from './payments.schema';
import { PaymentsController } from './payments.controller';

const router = Router();
const controller = new PaymentsController();

router.post(
  '/create-order',
  authenticate,
  authorize(Role.CUSTOMER),
  validate(createOrderSchema),
  controller.createOrder,
);

export { router as paymentsRouter };
