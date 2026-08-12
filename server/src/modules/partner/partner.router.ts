import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/roles.middleware';
import { validate } from '../../common/middleware/validate.middleware';
import { upsertLegalSchema, declineBookingSchema } from './partner-legal.schema';
import { PartnerController } from './partner.controller';

const router = Router();
const ctrl = new PartnerController();

router.use(authenticate, authorize(Role.PARTNER, Role.ADMIN));

router.get('/summary',                                    ctrl.getSummary);
router.get('/properties',                                 ctrl.getProperties);
router.get('/arrivals',                                   ctrl.getUpcomingArrivals);
router.get('/bookings',                                   ctrl.getBookings);
router.patch('/bookings/:id/noshow',                      ctrl.markNoShow);
router.patch('/bookings/:id/approve',                     ctrl.approveBooking);
router.patch('/bookings/:id/decline',                     validate(declineBookingSchema), ctrl.declineBooking);
router.get('/earnings',                                   ctrl.getEarnings);
router.get('/properties/:propertyId/legal',               ctrl.getLegal);
router.post('/properties/:propertyId/legal',              validate(upsertLegalSchema), ctrl.upsertLegal);
router.get('/properties/:propertyId/availability',        ctrl.getAvailability);
router.patch('/properties/:propertyId/availability',      ctrl.updateAvailability);

export { router as partnerRouter };
