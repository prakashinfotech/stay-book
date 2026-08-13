import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/roles.middleware';
import { validate, validateQuery } from '../../common/middleware/validate.middleware';
import {
  updatePropertyStatusSchema,
  updateUserRoleSchema,
  updateBookingStatusSchema,
  approvePropertySchema,
  rejectPropertySchema,
  approveKycSchema,
  rejectKycSchema,
  listQuerySchema,
} from './admin.schema';
import { AdminController } from './admin.controller';

const router = Router();
const ctrl = new AdminController();

router.use(authenticate, authorize(Role.ADMIN));

// Stats & lists
router.get('/stats',                                 ctrl.getStats);
router.get('/users',                                 validateQuery(listQuerySchema), ctrl.getUsers);
router.get('/properties',                            validateQuery(listQuerySchema), ctrl.getProperties);
router.get('/bookings',                              validateQuery(listQuerySchema), ctrl.getBookings);

// Property status & approval
router.patch('/properties/:id/status',               validate(updatePropertyStatusSchema), ctrl.updatePropertyStatus);
router.get('/properties/pending',                    validateQuery(listQuerySchema), ctrl.getPendingProperties);
router.post('/properties/:id/approve',               validate(approvePropertySchema), ctrl.approveProperty);
router.post('/properties/:id/reject',                validate(rejectPropertySchema), ctrl.rejectProperty);

// User management
router.patch('/users/:id/role',                      validate(updateUserRoleSchema), ctrl.updateUserRole);
router.delete('/users/:id',                          ctrl.deactivateUser);
router.post('/users/:id/restore',                    ctrl.restoreUser);

// Booking management
router.patch('/bookings/:id/status',                 validate(updateBookingStatusSchema), ctrl.updateBookingStatus);

// KYC management
router.get('/kyc',                                   validateQuery(listQuerySchema), ctrl.getAllKyc);
router.get('/kyc/:id',                               ctrl.getKycById);
router.post('/kyc/:id/approve',                      validate(approveKycSchema), ctrl.approveKyc);
router.post('/kyc/:id/reject',                       validate(rejectKycSchema), ctrl.rejectKyc);

// Audit logs
router.get('/audit-logs',                            validateQuery(listQuerySchema), ctrl.getAuditLogs);

export { router as adminRouter };
