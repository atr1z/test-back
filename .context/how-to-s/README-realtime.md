# Realtime Integration Guide

This guide shows how to integrate live tracking capabilities with your Atriz Core framework using Socket.io and Redis.

## Overview

The realtime integration provides:

- **Live GPS tracking** for vehicles and deliveries
- **WebSocket connections** with JWT authentication
- **Redis pub/sub** for horizontal scaling
- **Room-based broadcasting** for efficient updates
- **Connection management** with automatic reconnection

## Quick Start

### 1. Install Dependencies

The required dependencies are already included in the core package:

- `socket.io` - WebSocket server
- `@socket.io/redis-adapter` - Redis adapter for scaling
- `ioredis` - Redis client
- `jsonwebtoken` - JWT authentication

### 2. Basic Server Setup

```typescript
import { WebServiceWithRealtime } from '@atriz/core';

const config = {
    port: 3000,
    env: 'development',
    cors: { origin: 'http://localhost:5173' },
    realtime: {
        redisUrl: 'redis://localhost:6379',
        corsOrigin: 'http://localhost:5173',
        jwtSecret: process.env.JWT_SECRET,
    },
};

const webService = new WebServiceWithRealtime(config);
webService.listen();
```

### 3. Client Connection

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Authenticate
socket.emit('authenticate', 'your-jwt-token');

// Listen for authentication response
socket.on('authenticated', response => {
    if (response.success) {
        // Start tracking
        socket.emit('track:vehicle', 'vehicle-123');
    }
});

// Listen for location updates
socket.on('location:update', data => {
    console.log('Location update:', data);
});
```

## Architecture

### Server Components

1. **RealtimeServer** - WebSocket server with Redis adapter
2. **TrackingService** - GPS location management
3. **WebServiceWithRealtime** - Enhanced Express server

### Client Components

1. **TrackingClient** - WebSocket client wrapper
2. **Event Handlers** - Location update callbacks
3. **Authentication** - JWT token management

## API Reference

### Server API

#### WebServiceWithRealtime

```typescript
class WebServiceWithRealtime {
    constructor(config: AppConfig & { realtime?: RealtimeConfig });

    // Express app
    expressApp: Application;

    // HTTP server
    server: HTTPServer;

    // Realtime server (if enabled)
    realtime?: RealtimeServer;

    // Start server
    listen(callback?: () => void): void;

    // Close server
    close(): Promise<void>;
}
```

#### RealtimeServer

```typescript
class RealtimeServer {
    constructor(httpServer: HTTPServer, config: RealtimeConfig);

    // Emit location updates
    emitLocationUpdate(channel: string, data: LocationUpdateEvent): void;
    emitVehicleLocationUpdate(
        vehicleId: string,
        location: LocationUpdate
    ): void;
    emitDeliveryLocationUpdate(
        deliveryId: string,
        location: LocationUpdate
    ): void;

    // Broadcasting
    broadcastToAuthenticated(event: string, data: any): void;
    sendToUser(userId: string, event: string, data: any): void;

    // Statistics
    getStats(): { connections: number; rooms: number; uptime: number };

    // Cleanup
    close(): Promise<void>;
}
```

#### TrackingService

```typescript
class TrackingService {
    constructor(redis: Redis, io: SocketIOServer);

    // Publish location updates
    publishLocationUpdate(
        type: TrackingType,
        entityId: string,
        location: LocationUpdate
    ): Promise<void>;

    // Subscribe to updates
    subscribeToLocationUpdates(
        callback: (channel: string, data: LocationUpdateEvent) => void
    ): Redis;

    // Get cached locations
    getCurrentLocation(
        type: TrackingType,
        entityId: string
    ): Promise<LocationUpdate | null>;
    getAllVehicleLocations(): Promise<Map<string, LocationUpdate>>;

    // Cache management
    cacheCurrentLocation(
        type: TrackingType,
        entityId: string,
        location: LocationUpdate
    ): Promise<void>;
    clearCurrentLocation(type: TrackingType, entityId: string): Promise<void>;

    // Statistics
    getTrackingStats(): Promise<{
        activeVehicles: number;
        activeDeliveries: number;
        totalTracking: number;
    }>;
}
```

### Client API

#### TrackingClient

```typescript
class TrackingClient {
    constructor(serverUrl: string);

    // Connection management
    connect(): void;
    disconnect(): void;

    // Authentication
    authenticate(token: string): void;

    // Vehicle tracking
    trackVehicle(vehicleId: string): void;
    untrackVehicle(vehicleId: string): void;

    // Delivery tracking
    trackDelivery(deliveryId: string): void;
    untrackDelivery(deliveryId: string): void;

    // Event callbacks
    onLocationUpdateCallback(
        callback: (data: LocationUpdateEvent) => void
    ): void;
    onAuthenticationCallback(
        callback: (response: AuthenticationResponse) => void
    ): void;

    // Status
    get connected(): boolean;
    get authenticated(): boolean;
}
```

## Socket Events

### Client → Server

- `authenticate` - Authenticate with JWT token
- `track:vehicle` - Start tracking a vehicle
- `untrack:vehicle` - Stop tracking a vehicle
- `track:delivery` - Start tracking a delivery
- `untrack:delivery` - Stop tracking a delivery

### Server → Client

- `authenticated` - Authentication response
- `location:update` - Location update event
- `error` - Error message
- `connect` - Connection established
- `disconnect` - Connection lost

## Data Types

### LocationUpdate

```typescript
interface LocationUpdate {
    deviceId: string;
    userId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    altitude?: number;
    timestamp: Date;
    metadata?: Record<string, any>;
}
```

### LocationUpdateEvent

```typescript
interface LocationUpdateEvent {
    type: 'vehicle' | 'delivery';
    entityId: string;
    location: LocationUpdate;
}
```

### AuthenticationResponse

```typescript
interface AuthenticationResponse {
    success: boolean;
    message?: string;
}
```

## Examples

### 1. Vehicle Tracking Server

```typescript
import { WebServiceWithRealtime, TrackingService } from '@atriz/core';

const webService = new WebServiceWithRealtime({
    port: 3000,
    env: 'development',
    cors: { origin: 'http://localhost:5173' },
    realtime: {
        redisUrl: 'redis://localhost:6379',
        corsOrigin: 'http://localhost:5173',
        jwtSecret: process.env.JWT_SECRET,
    },
});

// Vehicle location endpoint
webService.expressApp.post('/api/vehicles/:id/location', async (req, res) => {
    const { id: vehicleId } = req.params;
    const locationData = req.body;

    const trackingService = new TrackingService(
        webService.realtime!.redis,
        webService.realtime!.socketIO
    );

    await trackingService.publishLocationUpdate('vehicle', vehicleId, {
        deviceId: vehicleId,
        userId: req.user?.id || 'system',
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        speed: locationData.speed,
        timestamp: new Date(),
    });

    res.json({ success: true });
});

webService.listen();
```

### 2. React Hook for Tracking

```typescript
import { useEffect, useState } from 'react';
import { TrackingClient, LocationUpdateEvent } from '@atriz/core';

export const useVehicleTracking = (vehicleId: string, token: string) => {
    const [location, setLocation] = useState<LocationUpdateEvent | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const client = new TrackingClient('http://localhost:3000');

        client.onLocationUpdateCallback(data => {
            if (data.entityId === vehicleId) {
                setLocation(data);
            }
        });

        client.onAuthenticationCallback(response => {
            if (response.success) {
                client.trackVehicle(vehicleId);
                setConnected(true);
            }
        });

        client.connect();
        client.authenticate(token);

        return () => {
            client.disconnect();
        };
    }, [vehicleId, token]);

    return { location, connected };
};
```

### 3. Map Integration

```typescript
import { TrackingClient } from '@atriz/core';

const client = new TrackingClient('http://localhost:3000');
const vehicleMarkers = new Map();

client.onLocationUpdateCallback(data => {
    if (data.type === 'vehicle') {
        const marker = vehicleMarkers.get(data.entityId);

        if (marker) {
            // Update existing marker
            marker.setLatLng([data.location.latitude, data.location.longitude]);
        } else {
            // Create new marker
            const newMarker = L.marker([
                data.location.latitude,
                data.location.longitude,
            ]).addTo(map);
            vehicleMarkers.set(data.entityId, newMarker);
        }
    }
});

client.connect();
client.authenticate(token);
```

## Configuration

### Environment Variables

```bash
# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# CORS
CORS_ORIGIN=http://localhost:5173
```

### RealtimeConfig

```typescript
interface RealtimeConfig {
    redisUrl: string;
    corsOrigin: string;
    jwtSecret?: string;
    pingInterval?: number; // Default: 25000ms
    pingTimeout?: number; // Default: 20000ms
}
```

## Production Considerations

### 1. Redis Configuration

- Use Redis Cluster for high availability
- Configure appropriate memory limits
- Set up monitoring and alerts

### 2. Scaling

- Deploy multiple server instances
- Use load balancer with sticky sessions
- Monitor connection counts and memory usage

### 3. Security

- Use strong JWT secrets
- Implement rate limiting
- Validate all incoming data
- Use HTTPS/WSS in production

### 4. Monitoring

- Track connection counts
- Monitor Redis memory usage
- Set up alerts for failures
- Log authentication attempts

## Troubleshooting

### Common Issues

1. **Connection Refused**
    - Check Redis is running
    - Verify Redis URL configuration
    - Check firewall settings

2. **Authentication Failed**
    - Verify JWT secret matches
    - Check token expiration
    - Validate token format

3. **Location Updates Not Received**
    - Check client is authenticated
    - Verify tracking is started
    - Check Redis pub/sub is working

4. **Memory Issues**
    - Monitor Redis memory usage
    - Check for memory leaks
    - Adjust cache TTL settings

### Debug Mode

Enable debug logging:

```typescript
const client = new TrackingClient('http://localhost:3000', {
    debug: true,
});
```

## Support

For issues and questions:

- Check the examples in `/src/examples/`
- Review the type definitions in `/src/types/`
- Test with the provided integration examples
