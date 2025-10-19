import { Router } from 'express';
// import { resolve } from '@atriz/core';
// import { createAuthMiddleware, AUTH_TOKENS } from '@atriz/auth';
// import { MEXTRACK_TOKENS } from '../di/tokens';

export default (): Router => {
    const router = Router();

    // TODO: Add auth middleware when implemented
    // const jwtService = resolve(AUTH_TOKENS.JWTService);
    // const authMiddleware = createAuthMiddleware(jwtService);
    // router.use(authMiddleware);

    /**
     * GET /api/vehicles
     * List all vehicles for the authenticated user
     */
    router.get('/', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Vehicle listing not implemented yet',
        });
    });

    /**
     * GET /api/vehicles/:id
     * Get vehicle by ID
     */
    router.get('/:id', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Vehicle details not implemented yet',
        });
    });

    /**
     * POST /api/vehicles
     * Create a new vehicle
     */
    router.post('/', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Vehicle creation not implemented yet',
        });
    });

    /**
     * PUT /api/vehicles/:id
     * Update vehicle
     */
    router.put('/:id', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Vehicle update not implemented yet',
        });
    });

    /**
     * DELETE /api/vehicles/:id
     * Delete vehicle
     */
    router.delete('/:id', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Vehicle deletion not implemented yet',
        });
    });

    return router;
};
