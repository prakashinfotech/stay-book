import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './app-error';
import { logger } from '../utils/logger';

export function globalErrorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error(`${req.method} ${req.url}`, { error });

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: error.flatten().fieldErrors,
      },
    });
    return;
  }

  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
}
