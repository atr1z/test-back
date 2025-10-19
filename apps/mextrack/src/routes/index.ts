import { Router } from 'express';
import authRoutes from './auth';
import vehiclesRoutes from './vehicles';
import trackingRoutes from './tracking';

const router = Router();

router.use('/auth', authRoutes);
router.use('/vehicles', vehiclesRoutes);
router.use('/tracking', trackingRoutes);

export default router;
