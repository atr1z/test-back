# @atriz/realtime

Real-time communication utilities for the Atriz Framework using Socket.io and Redis.

## Features

- WebSocket server with Socket.io
- Redis pub/sub adapter for horizontal scaling
- GPS tracking service for live location updates
- Authentication and authorization support
- Room-based broadcasting
- Connection management and monitoring
- TypeScript support

## Installation

This package is part of the Atriz monorepo.

```bash
pnpm add @atriz/realtime
```

## Quick Start

### 1. Setup Redis

```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or install locally (macOS)
brew install redis
brew services start redis
```

### 2. Initialize Realtime Server

```typescript
import { createServer } from 'http';
import { WebService } from '@atriz/core';
import { RealtimeServer, TrackingService } from '@atriz/realtime';

// Create HTTP server
const webService = new WebService({ port: 3001 });
const httpServer = createServer(webService.app);

// Initialize realtime server
const realtimeServer = new RealtimeServer(httpServer, {
  redisUrl: process.env.REDIS_URL!,
  corsOrigin: process.env.CORS_ORIGIN!,
});

// Initialize tracking service
const trackingService = new TrackingService(
  realtimeServer.redis,
  realtimeServer.socketIO
);

// Start server
httpServer.listen(3001, () => {
  console.log('✓ API and WebSocket server ready on port 3001');
});
```

### 3. Publish Location Updates

```typescript
// In your API controller
await trackingService.publishLocationUpdate(
  'vehicle',
  vehicleId,
  {
    deviceId: vehicleId,
    userId: userId,
    latitude: 40.7128,
    longitude: -74.0060,
    speed: 65,
    heading: 180,
    accuracy: 10,
    timestamp: new Date(),
  }
);
```

### 4. Client-Side Connection

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { token: authToken }
});

socket.on('connect', () => {
  console.log('Connected to tracking server');
  
  // Authenticate
  socket.emit('authenticate', authToken);
});

socket.on('authenticated', (data) => {
  if (data.success) {
    // Subscribe to vehicle tracking
    socket.emit('track:vehicle', vehicleId);
  }
});

socket.on('location:update', (data) => {
  console.log('New location:', data.location);
  // Update map marker, etc.
});
```

## API Reference

### RealtimeServer

Initialize a Socket.io server with Redis adapter for scaling.

```typescript
const realtimeServer = new RealtimeServer(httpServer, {
  redisUrl: 'redis://localhost:6379',
  corsOrigin: 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET,
});
```

**Methods:**
- `emitLocationUpdate(channel, data)` - Emit location update to room
- `get redis` - Access Redis client
- `get socketIO` - Access Socket.io instance
- `close()` - Shutdown server and close connections

### TrackingService

Manage GPS tracking, broadcasting, and caching.

```typescript
const trackingService = new TrackingService(redis, socketIO);
```

**Methods:**
- `publishLocationUpdate(type, entityId, location)` - Broadcast location
- `getCurrentLocation(type, entityId)` - Get cached location
- `cacheCurrentLocation(type, entityId, location)` - Cache location
- `subscribeToLocationUpdates(callback)` - Listen to updates

### Types

```typescript
interface LocationUpdate {
  deviceId: string;
  userId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: Date;
}

interface RealtimeConfig {
  redisUrl: string;
  corsOrigin: string;
  jwtSecret?: string;
}
```

## Socket Events

### Client → Server

- `authenticate` - Authenticate with JWT token
- `track:vehicle` - Subscribe to vehicle location updates
- `untrack:vehicle` - Unsubscribe from vehicle updates
- `track:delivery` - Subscribe to delivery location updates
- `untrack:delivery` - Unsubscribe from delivery updates

### Server → Client

- `authenticated` - Authentication result
- `location:update` - Real-time location update
- `error` - Error message
- `connect` - Connection established
- `disconnect` - Connection closed

## React Hook Example

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useVehicleTracking(vehicleId: string, token: string) {
  const [location, setLocation] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_WS_URL!, {
      auth: { token }
    });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('authenticate', token);
    });

    socket.on('authenticated', (data) => {
      if (data.success) {
        socket.emit('track:vehicle', vehicleId);
      }
    });

    socket.on('location:update', (data) => {
      setLocation(data.location);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.emit('untrack:vehicle', vehicleId);
      socket.close();
    };
  }, [vehicleId, token]);

  return { location, connected };
}
```

## Scaling

### Horizontal Scaling with Redis Adapter

The Redis adapter allows multiple Socket.io servers to share state:

```
Client A ──► Server 1 ──┐
Client B ──► Server 2 ──┼──► Redis ──► Broadcast to all servers
Client C ──► Server 3 ──┘
```

All servers receive pub/sub messages and emit to their connected clients.

### Load Balancing

Use sticky sessions to keep clients connected to the same server:

```nginx
upstream socketio {
    ip_hash;  # Sticky sessions
    server server1:3001;
    server server2:3001;
    server server3:3001;
}
```

## Performance Optimization

### Message Throttling

```typescript
// Limit to 1 update per second per vehicle
const throttle = new Map<string, number>();

function shouldProcess(vehicleId: string): boolean {
  const last = throttle.get(vehicleId) || 0;
  const now = Date.now();
  
  if (now - last < 1000) return false;
  
  throttle.set(vehicleId, now);
  return true;
}
```

### Redis Caching

Current locations are cached in Redis (5-minute TTL) for quick retrieval:

```typescript
await trackingService.getCurrentLocation('vehicle', vehicleId);
```

## Monitoring

```typescript
// Check active connections
const connections = io.engine.clientsCount;

// Check active rooms
const rooms = io.sockets.adapter.rooms.size;

// Check Redis health
const pong = await redis.ping();
```

## Environment Variables

```env
# Required
REDIS_URL=redis://localhost:6379

# Optional
WS_CORS_ORIGIN=http://localhost:5173
WS_PING_INTERVAL=25000
WS_PING_TIMEOUT=20000
JWT_SECRET=your-secret-key
```

## Troubleshooting

### Connection Issues

```typescript
// Client: Enable debug logs
const socket = io(url, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### Redis Connection

```bash
# Test Redis
redis-cli ping

# Check Redis logs
docker logs redis
```

## License

Private - Part of Atriz Framework

## See Also

- [Real-Time Tracking Documentation](../../.cascade/realtime-tracking.md)
- [Database Architecture](../../.cascade/db.md)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Redis Documentation](https://redis.io/docs/)
