import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/roles.middleware';
import { validate } from '../../common/middleware/validate.middleware';
import { createPropertySchema, updatePropertySchema, addRoomTypeSchema, addImagesSchema, createRatePlanSchema } from './properties.schema';
import { PropertiesController } from './properties.controller';

const router = Router();
const controller = new PropertiesController();

router.get('/featured', controller.getFeatured);
router.get('/:id/availability', controller.getAvailability);
router.get('/:id', controller.getById);
router.post('/', authenticate, authorize(Role.PARTNER, Role.ADMIN), validate(createPropertySchema), controller.create);
router.patch('/:id', authenticate, authorize(Role.PARTNER, Role.ADMIN), validate(updatePropertySchema), controller.update);
router.post('/:id/publish',     authenticate, authorize(Role.PARTNER, Role.ADMIN), controller.publish);
router.post('/:id/room-types',  authenticate, authorize(Role.PARTNER, Role.ADMIN), validate(addRoomTypeSchema),  controller.addRoomType);
router.post('/:id/images',      authenticate, authorize(Role.PARTNER, Role.ADMIN), validate(addImagesSchema),    controller.addImages);

// Rate plan management
router.get('/:id/room-types/:roomTypeId/rate-plans',     authenticate, authorize(Role.PARTNER, Role.ADMIN), controller.getRatePlans);
router.post('/:id/room-types/:roomTypeId/rate-plans',    authenticate, authorize(Role.PARTNER, Role.ADMIN), validate(createRatePlanSchema), controller.createRatePlan);
router.delete('/:id/room-types/:roomTypeId/rate-plans/:ratePlanId', authenticate, authorize(Role.PARTNER, Role.ADMIN), controller.deleteRatePlan);

export { router as propertiesRouter };
