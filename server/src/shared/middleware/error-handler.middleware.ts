import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.util';

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error('Internal server error', error);

  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
}
