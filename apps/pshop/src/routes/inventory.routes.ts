import { Router } from 'express';
// import { resolve } from '@atriz/core';
// import { createAuthMiddleware, AUTH_TOKENS } from '@atriz/auth';
// import { PSHOP_TOKENS } from '../di/tokens';

export default (): Router => {
    const router = Router();

    // TODO: Add auth middleware when implemented
    // const jwtService = resolve(AUTH_TOKENS.JWTService);
    // const authMiddleware = createAuthMiddleware(jwtService);
    // router.use(authMiddleware);

    /**
     * GET /api/inventory
     * Get inventory overview (low stock alerts, etc.)
     */
    router.get('/', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Inventory overview not implemented yet',
        });
    });

    /**
     * GET /api/inventory/:productId
     * Get inventory details for a product
     */
    router.get('/:productId', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Product inventory not implemented yet',
        });
    });

    /**
     * POST /api/inventory/:productId/adjust
     * Adjust inventory (add/remove stock)
     */
    router.post('/:productId/adjust', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Inventory adjustment not implemented yet',
        });
    });

    /**
     * GET /api/inventory/low-stock
     * Get products with low stock
     */
    router.get('/low-stock', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Low stock alerts not implemented yet',
        });
    });

    /**
     * GET /api/inventory/history/:productId
     * Get inventory movement history
     */
    router.get('/history/:productId', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Inventory history not implemented yet',
        });
    });

    return router;
};
