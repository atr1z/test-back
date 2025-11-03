import pinoHttp from 'pino-http';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * HTTP request logger middleware using Pino
 *
 * Features:
 * - Automatic request/response logging
 * - Request ID correlation (X-Request-ID header)
 * - Logs method, path, status code, duration
 * - Attaches logger to req.log for per-request logging
 *
 * @example
 * ```typescript
 * app.use(httpLogger);
 *
 * // In your routes/controllers:
 * req.log.info({ userId: '123' }, 'User action performed');
 * ```
 */
export const httpLogger: RequestHandler = pinoHttp({
    logger,

    // Generate or use existing request ID
    genReqId: (req: Request) => {
        const existingId = req.headers['x-request-id'];
        if (existingId && typeof existingId === 'string') {
            return existingId;
        }
        return uuidv4();
    },

    // Add request ID to response headers
    customSuccessMessage: (req: Request, res: Response) => {
        return `${req.method} ${req.url} ${res.statusCode}`;
    },

    customErrorMessage: (req: Request, res: Response, error: Error) => {
        return `${req.method} ${req.url} ${res.statusCode} - ${error.message}`;
    },

    // Custom log level based on status code
    customLogLevel: (_req: Request, res: Response, error?: Error) => {
        if (error) {
            return 'error';
        }

        if (res.statusCode >= 500) {
            return 'error';
        }

        if (res.statusCode >= 400) {
            return 'warn';
        }

        if (res.statusCode >= 300) {
            return 'info';
        }

        return 'info';
    },

    // Customize logged request properties
    customProps: (req: Request, res: Response) => {
        const user = (req as any).user;
        return {
            requestId: res.getHeader('x-request-id') || req.id,
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.socket.remoteAddress,
            // Add user context if available (set by auth middleware)
            ...(user ? { userId: user.userId } : {}),
        };
    },

    // Automatically set request ID header in response
    customReceivedMessage: (req: Request) => {
        return `Request received: ${req.method} ${req.url}`;
    },

    // Attach request ID to response header
    customAttributeKeys: {
        req: 'request',
        res: 'response',
        err: 'error',
        responseTime: 'duration',
    },

    // Serialize request/response (be careful with sensitive data)
    serializers: {
        req: req => ({
            id: req.id,
            method: req.method,
            url: req.url,
            // Only log query params, not body (may contain sensitive data)
            query: req.query,
            params: req.params,
            // Include user info if available
            user: req.raw?.user ? { userId: req.raw.user.userId } : undefined,
        }),
        res: res => ({
            statusCode: res.statusCode,
        }),
    },
});

/**
 * Middleware to add request ID to response headers
 * Should be used before httpLogger
 */
export function requestIdMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    req.id = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
}

/**
 * Combined middleware that adds request ID and HTTP logging
 * This is the recommended way to use both middlewares together
 */
export function createHttpLoggerMiddleware(): RequestHandler[] {
    return [requestIdMiddleware, httpLogger as RequestHandler];
}
