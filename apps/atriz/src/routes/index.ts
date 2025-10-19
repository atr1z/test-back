import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

export default (): Router => {
    const router = Router();

    // Mount routes
    router.use('/auth', authRoutes());
    router.use('/users', userRoutes());

    return router;
};
