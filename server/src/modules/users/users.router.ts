import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize, Role } from '../../common/middleware/roles.middleware';
import { UsersController } from './users.controller';

const router = Router();
const controller = new UsersController();

router.get('/:id', authenticate, controller.findOne);
router.patch('/:id', authenticate, controller.update);
router.delete('/:id', authenticate, authorize(Role.ADMIN), controller.remove);

export { router as usersRouter };
