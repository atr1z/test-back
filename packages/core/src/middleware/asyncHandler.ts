import { Request, Response, NextFunction } from 'express';
import { RouteHandler } from '../types';

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: RouteHandler) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
