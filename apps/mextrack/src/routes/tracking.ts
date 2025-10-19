import { Router } from 'express';
import * as trackingController from '../controllers/tracking.controller';
import { authMiddleware } from '@mextrack/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/:vehicleId', trackingController.getTrackingData);
router.post('/:vehicleId', trackingController.addTrackingData);

export default router;
