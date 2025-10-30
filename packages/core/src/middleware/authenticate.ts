import { Response, NextFunction } from 'express';
import { JWTService } from '../service/jwt';
import { AuthRequest } from '../types';

/**
 * Create authentication middleware
 */
export const createAuthMiddleware = (jwtService: JWTService) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({
                    message: 'No token provided',
                    statusCode: 401,
                });
                return;
            }

            const token = authHeader.substring(7); // Remove 'Bearer ' prefix
            const payload = jwtService.verifyToken(token);

            req.user = payload;
            next();
        } catch (error) {
            res.status(401).json({
                message:
                    error instanceof Error ? error.message : 'Invalid token',
                statusCode: 401,
            });
        }
    };
};
