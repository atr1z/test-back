import { Router } from 'express';
import * as vehiclesController from '../controllers/vehicles.controller';
import { authMiddleware } from '@mextrack/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', vehiclesController.getVehicles);
router.get('/:id', vehiclesController.getVehicle);
router.post('/', vehiclesController.createVehicle);
router.put('/:id', vehiclesController.updateVehicle);
router.delete('/:id', vehiclesController.deleteVehicle);

export default router;
