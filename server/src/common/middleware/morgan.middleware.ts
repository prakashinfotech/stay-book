import morgan from 'morgan';
import { logger } from '../utils/logger';

const stream = {
  write: (message: string) => logger.http(message.trim()),
};

export const morganMiddleware = morgan('combined', { stream });
