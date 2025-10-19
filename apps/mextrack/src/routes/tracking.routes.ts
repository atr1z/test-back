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
     * GET /api/tracking/:vehicleId
     * Get tracking history for a vehicle
     */
    router.get('/:vehicleId', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Tracking history not implemented yet',
        });
    });

    /**
     * GET /api/tracking/:vehicleId/latest
     * Get latest position for a vehicle
     */
    router.get('/:vehicleId/latest', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Latest position not implemented yet',
        });
    });

    /**
     * POST /api/tracking/:vehicleId
     * Add tracking point for a vehicle
     */
    router.post('/:vehicleId', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Add tracking point not implemented yet',
        });
    });

    /**
     * POST /api/tracking/:vehicleId/batch
     * Add multiple tracking points (batch import)
     */
    router.post('/:vehicleId/batch', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Batch tracking import not implemented yet',
        });
    });

    return router;
};
