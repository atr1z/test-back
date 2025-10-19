import { Router } from 'express';
import authRoutes from './auth';
import productsRoutes from './products';
import salesRoutes from './sales';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/sales', salesRoutes);

export default router;
