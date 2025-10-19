import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@mextrack/types';
import { logger } from '@mextrack/utils';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Error:', error);

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      ...(error.details && { details: error.details }),
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}
