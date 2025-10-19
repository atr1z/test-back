import { Router } from 'express';
import authRoutes from './auth.routes';
import vehicleRoutes from './vehicle.routes';
import trackingRoutes from './tracking.routes';

export default (): Router => {
    const router = Router();

    // Mount routes
    router.use('/auth', authRoutes());
    router.use('/vehicles', vehicleRoutes());
    router.use('/tracking', trackingRoutes());

    // Future routes
    // router.use('/geofences', geofenceRoutes());
    // router.use('/alerts', alertRoutes());
    // router.use('/reports', reportRoutes());

    return router;
};
