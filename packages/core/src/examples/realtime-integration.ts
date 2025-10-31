/**
 * Example: Integrating Realtime Server with Atriz Core Framework
 *
 * This example shows how to use the WebServiceWithRealtime class
 * to add live tracking capabilities to your applications.
 */

import { WebServiceWithRealtime, TrackingService } from '../index.js';
import { AppConfig, RealtimeConfig } from '../types/index.js';

// Example configuration
const config: AppConfig & { realtime: RealtimeConfig } = {
    port: 3000,
    env: 'development',
    cors: {
        origin: 'http://localhost:5173',
        credentials: true,
    },
    realtime: {
        redisUrl: 'redis://localhost:6379',
        corsOrigin: 'http://localhost:5173',
        jwtSecret: process.env['JWT_SECRET'] || 'your-jwt-secret',
        pingInterval: 25000,
        pingTimeout: 20000,
    },
};

// Create the enhanced web service
const webService = new WebServiceWithRealtime(config);

// Add your Express routes as usual
webService.expressApp.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Example: Vehicle tracking endpoint
webService.expressApp.post('/api/vehicles/:id/location', async (req, res) => {
    try {
        const { id: vehicleId } = req.params;
        const locationData = req.body;

        // Validate location data
        if (!locationData.latitude || !locationData.longitude) {
            res.status(400).json({ error: 'Invalid location data' });
            return;
        }

        // Create tracking service instance
        const trackingService = new TrackingService(
            webService.realtime!.redis,
            webService.realtime!.socketIO
        );

        // Publish location update
        await trackingService.publishLocationUpdate('vehicle', vehicleId, {
            deviceId: vehicleId,
            userId: (req as any).user?.id || 'system', // Assuming you have user middleware
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            speed: locationData.speed,
            heading: locationData.heading,
            accuracy: locationData.accuracy,
            altitude: locationData.altitude,
            timestamp: new Date(),
            metadata: locationData.metadata,
        });

        res.json({ success: true, message: 'Location updated' });
    } catch (error) {
        console.error('Error updating vehicle location:', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
});

// Example: Delivery tracking endpoint
webService.expressApp.post('/api/deliveries/:id/location', async (req, res) => {
    try {
        const { id: deliveryId } = req.params;
        const locationData = req.body;

        // Create tracking service instance
        const trackingService = new TrackingService(
            webService.realtime!.redis,
            webService.realtime!.socketIO
        );

        // Publish delivery location update
        await trackingService.publishLocationUpdate('delivery', deliveryId, {
            deviceId: deliveryId,
            userId: (req as any).user?.id || 'system',
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            speed: locationData.speed,
            heading: locationData.heading,
            accuracy: locationData.accuracy,
            altitude: locationData.altitude,
            timestamp: new Date(),
            metadata: locationData.metadata,
        });

        res.json({ success: true, message: 'Delivery location updated' });
    } catch (error) {
        console.error('Error updating delivery location:', error);
        res.status(500).json({ error: 'Failed to update delivery location' });
    }
});

// Example: Get current vehicle locations
webService.expressApp.get('/api/vehicles/locations', async (_req, res) => {
    try {
        const trackingService = new TrackingService(
            webService.realtime!.redis,
            webService.realtime!.socketIO
        );

        const locations = await trackingService.getAllVehicleLocations();
        const locationsArray = Array.from(locations.entries()).map(
            ([id, location]) => ({
                vehicleId: id,
                ...location,
            })
        );

        res.json({ locations: locationsArray });
    } catch (error) {
        console.error('Error getting vehicle locations:', error);
        res.status(500).json({ error: 'Failed to get vehicle locations' });
    }
});

// Example: Get tracking statistics
webService.expressApp.get('/api/tracking/stats', async (_req, res) => {
    try {
        const trackingService = new TrackingService(
            webService.realtime!.redis,
            webService.realtime!.socketIO
        );

        const stats = await trackingService.getTrackingStats();
        const realtimeStats = webService.realtime!.getStats();

        res.json({
            tracking: stats,
            realtime: realtimeStats,
        });
    } catch (error) {
        console.error('Error getting tracking stats:', error);
        res.status(500).json({ error: 'Failed to get tracking stats' });
    }
});

// Start the server
webService.listen(() => {
    console.log('🚀 Server with realtime capabilities started');
    console.log('📡 WebSocket server ready for live tracking');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await webService.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await webService.close();
    process.exit(0);
});

export default webService;
