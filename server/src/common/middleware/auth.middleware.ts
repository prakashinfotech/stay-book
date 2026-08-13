import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/app-error';
import { config } from '../../config/env';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    next(new UnauthorizedError('No token provided'));
    return;
  }

  try {
    req.user = jwt.verify(token, config.JWT_SECRET) as AuthUser;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token', 'TOKEN_INVALID'));
  }
}
