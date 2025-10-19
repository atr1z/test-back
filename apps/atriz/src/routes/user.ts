import { Router, Response } from 'express';
import { asyncHandler } from '@atriz/core';
import { JWTService, createAuthMiddleware, AuthRequest } from '@atriz/auth';

export default (jwtService: JWTService): Router => {
    const router = Router();
    const authenticate = createAuthMiddleware(jwtService);

    /**
     * GET /api/users/me
     * Get current user profile (protected route)
     */
    router.get(
        '/me',
        authenticate,
        asyncHandler(async (req: AuthRequest, res: Response) => {
            // req.user is populated by the auth middleware
            res.json({
                message: 'User profile retrieved successfully',
                data: {
                    user: req.user,
                },
            });
        })
    );

    /**
     * GET /api/users/:id
     * Get user by ID (protected route)
     */
    router.get(
        '/:id',
        authenticate,
        asyncHandler(async (req: AuthRequest, res: Response) => {
            const { id } = req.params;

            // In a real app, you would fetch the user from database
            res.json({
                message: 'User retrieved successfully',
                data: {
                    user: {
                        id,
                        email: 'example@example.com',
                        name: 'Example User',
                    },
                },
            });
        })
    );

    return router;
};
