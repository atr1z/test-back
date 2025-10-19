import { Response } from 'express';
import { SuccessResponse, ErrorResponse } from '@mextrack/types';

/**
 * Send success response
 */
export function successResponse<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  return res.status(statusCode).json(response);
}

/**
 * Send error response
 */
export function errorResponse(
  res: Response,
  error: string,
  statusCode = 400,
  details?: unknown
): Response {
  const response: ErrorResponse = {
    success: false,
    error,
    ...(details && { details }),
  };
  return res.status(statusCode).json(response);
}

/**
 * Send created response (201)
 */
export function createdResponse<T>(res: Response, data: T, message?: string): Response {
  return successResponse(res, data, message, 201);
}

/**
 * Send no content response (204)
 */
export function noContentResponse(res: Response): Response {
  return res.status(204).send();
}
