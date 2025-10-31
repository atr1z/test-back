import { Request, Response, NextFunction } from 'express';
import { RouteHandler } from '../types/index.js';

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: RouteHandler) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = fn(req, res, next);
            // If the result is a Promise, handle it
            if (result && typeof result.then === 'function') {
                return result.catch(next);
            }
            // If it's not a Promise, return the result
            return result;
        } catch (error) {
            // Handle synchronous errors
            return next(error);
        }
    };
};
