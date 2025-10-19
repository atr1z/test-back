import { Router } from 'express';
import { resolve } from '@atriz/core';
import { JWTService, PasswordService, createAuthMiddleware, AUTH_TOKENS } from '@atriz/auth';
import {
    GetUserProfileController,
    UpdateUserProfileController,
    GetUserByIdController,
} from '../controllers';

export default (): Router => {
    const router = Router();

    // Resolve services from DI container
    const jwtService = resolve<JWTService>(AUTH_TOKENS.JWTService);
    const passwordService = resolve<PasswordService>(AUTH_TOKENS.PasswordService);
    const services = { jwtService, passwordService };

    const authenticate = createAuthMiddleware(jwtService);

    /**
     * GET /api/users/me
     * Get current user profile (protected)
     */
    router.get('/me', authenticate, (req, res) => {
        const controller = new GetUserProfileController(req, res, services);
        return controller.handle();
    });

    /**
     * PUT /api/users/me
     * Update current user profile (protected)
     */
    router.put('/me', authenticate, (req, res) => {
        const controller = new UpdateUserProfileController(req, res, services);
        return controller.handle();
    });

    /**
     * GET /api/users/:id
     * Get user by ID (protected)
     */
    router.get('/:id', authenticate, (req, res) => {
        const controller = new GetUserByIdController(req, res, services);
        return controller.handle();
    });

    return router;
};
