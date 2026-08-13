import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/roles.middleware';
import { validate } from '../../common/middleware/validate.middleware';
import { createHoldSchema, createBookingSchema } from './bookings.schema';
import { BookingsController } from './bookings.controller';

const router = Router();
const controller = new BookingsController();

router.post('/hold', authenticate, authorize(Role.CUSTOMER), validate(createHoldSchema), controller.createHold);
router.post('/', authenticate, authorize(Role.CUSTOMER), validate(createBookingSchema), controller.createBooking);
router.get('/', authenticate, authorize(Role.CUSTOMER), controller.getMyBookings);
router.get('/:id', authenticate, authorize(Role.CUSTOMER), controller.getBookingById);
router.post('/:id/cancel', authenticate, authorize(Role.CUSTOMER), controller.cancelBooking);

export { router as bookingsRouter };
