import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../common/middleware/auth.middleware';
import { AuthController } from './auth.controller';
import { config } from '../../config/env';

const router = Router();
const controller = new AuthController();

const authLimiter = rateLimit({ windowMs: 60_000, max: config.NODE_ENV === 'development' ? 100 : 5 });

router.post('/register', authLimiter, controller.register);
router.post('/verify-otp', authLimiter, controller.verifyOtp);
router.post('/resend-otp', authLimiter, controller.resendOtp);
router.post('/login', authLimiter, controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', authenticate, controller.logout);

export { router as authRouter };
