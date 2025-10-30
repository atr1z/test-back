import { Router } from 'express';
import authRoutes from './auth.routes.js';

export default (): Router => {
    const router = Router();

    // Mount routes
    router.use('/auth', authRoutes);

    return router;
};
