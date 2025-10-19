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
     * GET /api/products
     * List all products (with pagination, search, filters)
     */
    router.get('/', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Product listing not implemented yet',
        });
    });

    /**
     * GET /api/products/:id
     * Get product by ID
     */
    router.get('/:id', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Product details not implemented yet',
        });
    });

    /**
     * POST /api/products
     * Create a new product
     */
    router.post('/', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Product creation not implemented yet',
        });
    });

    /**
     * PUT /api/products/:id
     * Update product
     */
    router.put('/:id', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Product update not implemented yet',
        });
    });

    /**
     * DELETE /api/products/:id
     * Delete product (soft delete)
     */
    router.delete('/:id', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Product deletion not implemented yet',
        });
    });

    /**
     * GET /api/products/:id/stock
     * Get product stock levels
     */
    router.get('/:id/stock', (req, res) => {
        res.status(501).json({
            success: false,
            message: 'Stock levels not implemented yet',
        });
    });

    return router;
};
