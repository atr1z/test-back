import { Router } from 'express';
// import { resolve } from '@atriz/core';
// import { JWTService, PasswordService, AUTH_TOKENS } from '@atriz/auth';

export default (): Router => {
    const router = Router();

    // TODO: Implement authentication routes
    // const jwtService = resolve<JWTService>(AUTH_TOKENS.JWTService);
    // const passwordService = resolve<PasswordService>(AUTH_TOKENS.PasswordService);

    /**
     * POST /api/auth/register
     * Register a new user
     */
    router.post('/register', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Not implemented yet',
        });
    });

    /**
     * POST /api/auth/login
     * Login user
     */
    router.post('/login', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Not implemented yet',
        });
    });

    /**
     * POST /api/auth/logout
     * Logout user
     */
    router.post('/logout', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Not implemented yet',
        });
    });

    /**
     * GET /api/auth/me
     * Get current user
     */
    router.get('/me', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Not implemented yet',
        });
    });

    return router;
};
