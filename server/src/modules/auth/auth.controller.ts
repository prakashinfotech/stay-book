import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { loginSchema, registerSchema, refreshTokenSchema, resendOtpSchema } from './auth.schema';
import { ok, created } from '../../common/utils/response';

export class AuthController {
  private readonly authService = new AuthService();

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = registerSchema.parse(req.body);
      const user = await this.authService.register(dto);
      created(res, user);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = loginSchema.parse(req.body);
      const tokens = await this.authService.login(dto);
      ok(res, tokens, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, code } = req.body as { userId: string; code: string };
      const result = await this.authService.verifyOtp(userId, code);
      ok(res, result, 'Email verified');
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      const tokens = await this.authService.refresh(refreshToken);
      ok(res, tokens);
    } catch (error) {
      next(error);
    }
  };

  resendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = resendOtpSchema.parse(req.body);
      const result = await this.authService.resendOtp(dto);
      created(res, result);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.logout(req.user!.id);
      ok(res, null, 'Logged out');
    } catch (error) {
      next(error);
    }
  };
}
