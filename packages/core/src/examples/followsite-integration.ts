/**
 * Example: Followsite Integration with Realtime Tracking
 *
 * This example shows how to integrate the realtime server
 * into the Followsite application for live vehicle tracking.
 */

import { WebServiceWithRealtime, TrackingService } from '../index';
import { AppConfig, RealtimeConfig } from '../types';

// Followsite-specific configuration
const config: AppConfig & { realtime: RealtimeConfig } = {
    port: 3001, // Followsite port
    env: 'development',
    cors: {
        origin: 'http://localhost:5173', // Frontend URL
        credentials: true,
    },
    realtime: {
        redisUrl: process.env['REDIS_URL'] || 'redis://localhost:6379',
        corsOrigin: 'http://localhost:5173',
        jwtSecret: process.env['JWT_SECRET'] || 'your-jwt-secret',
        pingInterval: 25000,
        pingTimeout: 20000,
    },
};

// Create the enhanced web service
const webService = new WebServiceWithRealtime(config);

// Health check endpoint
webService.expressApp.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'followsite',
        timestamp: new Date().toISOString(),
        realtime: webService.realtime ? 'enabled' : 'disabled',
    });
});

// Vehicle location update endpoint
webService.expressApp.post('/api/vehicles/:id/location', async (req, res) => {
    try {
        const { id: vehicleId } = req.params;
        const locationData = req.body;

        // Validate required fields
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
            userId: (req as any).user?.id || 'system',
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            speed: locationData.speed || 0,
            heading: locationData.heading || 0,
            accuracy: locationData.accuracy || 10,
            altitude: locationData.altitude || 0,
            timestamp: new Date(),
            metadata: {
                ...locationData.metadata,
                source: 'followsite',
                version: '1.0.0',
            },
        });

        res.json({
            success: true,
            message: 'Location updated',
            vehicleId,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error updating vehicle location:', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
});

// Get all vehicle locations
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

        res.json({
            vehicles: locationsArray,
            count: locationsArray.length,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error getting vehicle locations:', error);
        res.status(500).json({ error: 'Failed to get vehicle locations' });
    }
});

// Get specific vehicle location
webService.expressApp.get('/api/vehicles/:id/location', async (req, res) => {
    try {
        const { id: vehicleId } = req.params;

        const trackingService = new TrackingService(
            webService.realtime!.redis,
            webService.realtime!.socketIO
        );

        const location = await trackingService.getCurrentLocation(
            'vehicle',
            vehicleId
        );

        if (!location) {
            res.status(404).json({ error: 'Vehicle location not found' });
            return;
        }

        res.json({
            vehicleId,
            location,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error getting vehicle location:', error);
        res.status(500).json({ error: 'Failed to get vehicle location' });
    }
});

// Get tracking statistics
webService.expressApp.get('/api/tracking/stats', async (_req, res) => {
    try {
        const trackingService = new TrackingService(
            webService.realtime!.redis,
            webService.realtime!.socketIO
        );

        const [trackingStats, realtimeStats] = await Promise.all([
            trackingService.getTrackingStats(),
            Promise.resolve(webService.realtime!.getStats()),
        ]);

        res.json({
            tracking: trackingStats,
            realtime: realtimeStats,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error getting tracking stats:', error);
        res.status(500).json({ error: 'Failed to get tracking stats' });
    }
});

// Vehicle status endpoint (online/offline)
webService.expressApp.get('/api/vehicles/:id/status', async (req, res) => {
    try {
        const { id: vehicleId } = req.params;

        const trackingService = new TrackingService(
            webService.realtime!.redis,
            webService.realtime!.socketIO
        );

        const location = await trackingService.getCurrentLocation(
            'vehicle',
            vehicleId
        );
        const isOnline =
            location && Date.now() - location.timestamp.getTime() < 300000; // 5 minutes

        res.json({
            vehicleId,
            isOnline,
            lastSeen: location?.timestamp || null,
            location: isOnline ? location : null,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error getting vehicle status:', error);
        res.status(500).json({ error: 'Failed to get vehicle status' });
    }
});

// Start the server
webService.listen(() => {
    console.log('🚀 Followsite API with realtime tracking started');
    console.log('📡 WebSocket server ready for live vehicle tracking');
    console.log('🔗 Connect to: ws://localhost:3001');
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
