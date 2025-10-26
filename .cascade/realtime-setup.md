# Real-Time Tracking Setup Guide

## What Was Created

The `@atriz/realtime` package provides WebSocket-based real-time communication for GPS tracking with the following components:

### Package Structure

```
packages/realtime/
├── src/
│   ├── index.ts              # Package exports
│   ├── types.ts              # TypeScript types and interfaces
│   ├── socket-server.ts      # Socket.io server with Redis adapter
│   └── tracking.ts           # GPS tracking service
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── README.md                 # Package documentation
└── .gitignore               # Git ignore rules
```

### Key Features

- **WebSocket Server**: Socket.io with Redis pub/sub adapter for horizontal scaling
- **GPS Tracking**: Real-time location updates with caching
- **Authentication**: JWT-based WebSocket authentication
- **Room-Based Broadcasting**: Efficient message delivery to interested clients
- **Cost-Effective**: 85-90% cheaper than Firebase/Pusher at scale

## Installation Steps

### 1. Install Dependencies

Run from the project root:

```bash
# Install all dependencies (including realtime package)
pnpm install
```

### 2. Setup Redis

**Option A: Docker (Recommended for Development)**

```bash
# Create docker-compose.yml or add to existing
cat >> docker-compose.yml << 'EOF'
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data

volumes:
  redis_data:
EOF

# Start Redis
docker-compose up -d redis
```

**Option B: Local Installation (macOS)**

```bash
brew install redis
brew services start redis
```

**Option C: Production (Managed Redis)**

- DigitalOcean Managed Redis: $15/month
- AWS ElastiCache: $13/month
- Upstash Redis: Pay per use

### 3. Configure Environment Variables

Add to your application `.env` files:

**apps/mextrack/.env:**
```env
# Existing variables...

# Redis
REDIS_URL=redis://localhost:6379

# WebSocket
WS_CORS_ORIGIN=http://localhost:5173
```

**apps/pshop/.env:**
```env
# Existing variables...

# Redis
REDIS_URL=redis://localhost:6379

# WebSocket
WS_CORS_ORIGIN=http://localhost:5173
```

### 4. Build the Package

```bash
# Build realtime package
pnpm --filter @atriz/realtime build

# Or build all packages
pnpm build
```

## Integration with Applications

### Update Mextrack API

**apps/mextrack/src/index.ts:**

```typescript
import { createServer } from 'http';
import { WebService } from '@atriz/core';
import { RealtimeServer, TrackingService } from '@atriz/realtime';
import { container } from 'tsyringe';

// Create HTTP server (instead of just Express app)
const webService = new WebService({ port: 3001 });
const httpServer = createServer(webService.app);

// Initialize realtime server
const realtimeServer = new RealtimeServer(httpServer, {
  redisUrl: process.env.REDIS_URL!,
  corsOrigin: process.env.WS_CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET,
});

// Initialize tracking service
const trackingService = new TrackingService(
  realtimeServer.redis,
  realtimeServer.socketIO
);

// Register in DI container
container.registerInstance('TrackingService', trackingService);
container.registerInstance('RealtimeServer', realtimeServer);

// Register routes...
// (existing route registration code)

// Start server (use httpServer instead of webService.start())
httpServer.listen(3001, () => {
  console.log('✓ Mextrack API listening on port 3001');
  console.log('✓ WebSocket server ready');
  console.log(`✓ Redis connected: ${process.env.REDIS_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing servers...');
  await realtimeServer.close();
  httpServer.close();
  process.exit(0);
});
```

### Create GPS Tracking Controller

**apps/mextrack/src/controllers/TrackingController.ts:**

```typescript
import { BaseController, ControllerRequest, ParamDefinition } from '@atriz/core';
import { TrackingService } from '@atriz/realtime';
import { DatabasePool } from '@atriz/database';
import { Response } from 'express';

interface Services {
  trackingService: TrackingService;
  trackingDb: DatabasePool; // atriz_tracking database connection
}

export class RecordLocationController extends BaseController<Services> {
  constructor(req: ControllerRequest, res: Response, services: Services) {
    super(req, res, services);
    this.requiresAuth = true;
  }

  protected defineParams(): ParamDefinition[] {
    return [
      { name: 'vehicleId', type: 'uuid', required: true },
      { name: 'latitude', type: 'number', required: true, min: -90, max: 90 },
      { name: 'longitude', type: 'number', required: true, min: -180, max: 180 },
      { name: 'speed', type: 'number', required: false, min: 0 },
      { name: 'heading', type: 'number', required: false, min: 0, max: 360 },
      { name: 'accuracy', type: 'number', required: false, min: 0 },
    ];
  }

  protected async execute(): Promise<any> {
    const vehicleId = this.getParam<string>('vehicleId');
    const latitude = this.getParam<number>('latitude');
    const longitude = this.getParam<number>('longitude');
    const speed = this.getParam<number>('speed');
    const heading = this.getParam<number>('heading');
    const accuracy = this.getParam<number>('accuracy');

    const locationData = {
      deviceId: vehicleId,
      userId: this.userId!,
      latitude,
      longitude,
      speed,
      heading,
      accuracy,
      timestamp: new Date(),
    };

    // 1. Store in TimescaleDB (persistent)
    await this.services!.trackingDb.query(`
      INSERT INTO location_events (
        time, device_id, user_id, app_source,
        latitude, longitude, speed, heading, accuracy
      ) VALUES (NOW(), $1, $2, 'mextrack', $3, $4, $5, $6, $7)
    `, [vehicleId, this.userId, latitude, longitude, speed, heading, accuracy]);

    // 2. Broadcast real-time update to subscribers
    await this.services!.trackingService.publishLocationUpdate(
      'vehicle',
      vehicleId,
      locationData
    );

    return {
      success: true,
      timestamp: locationData.timestamp,
      message: 'Location updated',
    };
  }
}
```

### Register Route

**apps/mextrack/src/routes/tracking.ts:**

```typescript
import { Router } from 'express';
import { RecordLocationController } from '../controllers/TrackingController';

const router = Router();

router.post('/location', (req, res) => {
  const controller = new RecordLocationController(req, res, {
    trackingService: req.app.locals.trackingService,
    trackingDb: req.app.locals.trackingDb,
  });
  return controller.handle();
});

export default router;
```

## Client-Side Integration

### React Hook for Vehicle Tracking

**frontend/src/hooks/useVehicleTracking.ts:**

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useVehicleTracking(vehicleId: string, authToken: string) {
  const [location, setLocation] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_WS_URL, {
      transports: ['websocket', 'polling'],
      auth: { token: authToken },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Connected to tracking server');
      setConnected(true);
      newSocket.emit('authenticate', authToken);
    });

    newSocket.on('authenticated', (data) => {
      if (data.success) {
        newSocket.emit('track:vehicle', vehicleId);
      }
    });

    newSocket.on('location:update', (data) => {
      console.log('Location update:', data);
      setLocation(data.location);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from tracking server');
      setConnected(false);
    });

    newSocket.on('reconnect', () => {
      console.log('Reconnected, re-subscribing...');
      newSocket.emit('track:vehicle', vehicleId);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('untrack:vehicle', vehicleId);
        newSocket.close();
      }
    };
  }, [vehicleId, authToken]);

  return { location, connected, socket };
}
```

### Usage in Component

```typescript
import { useVehicleTracking } from '../hooks/useVehicleTracking';

function VehicleMap({ vehicleId }: { vehicleId: string }) {
  const { location, connected } = useVehicleTracking(vehicleId, authToken);

  return (
    <div>
      <div className="status">
        {connected ? '🟢 Live Tracking' : '🔴 Offline'}
      </div>
      
      {location && (
        <Map center={[location.latitude, location.longitude]}>
          <Marker 
            position={[location.latitude, location.longitude]}
            rotation={location.heading}
          />
          <div className="info">
            Speed: {location.speed} km/h
          </div>
        </Map>
      )}
    </div>
  );
}
```

## Testing

### 1. Test Redis Connection

```bash
redis-cli ping
# Should return: PONG
```

### 2. Test WebSocket Connection

Create a test client:

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('authenticate', 'your-jwt-token');
});

socket.on('authenticated', (data) => {
  console.log('Authenticated:', data);
  if (data.success) {
    socket.emit('track:vehicle', 'vehicle-id-here');
  }
});

socket.on('location:update', (data) => {
  console.log('Location:', data);
});
```

### 3. Test GPS Update

```bash
curl -X POST http://localhost:3001/api/tracking/location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "vehicleId": "123e4567-e89b-12d3-a456-426614174000",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "speed": 65,
    "heading": 180,
    "accuracy": 10
  }'
```

## Monitoring

### Health Check Endpoint

Add to your API:

```typescript
app.get('/health/realtime', async (req, res) => {
  const stats = realtimeServer.getStats();
  const trackingStats = await trackingService.getTrackingStats();
  
  res.json({
    status: 'healthy',
    websocket: {
      connections: stats.connections,
      rooms: stats.rooms,
    },
    tracking: trackingStats,
    redis: await realtimeServer.redis.ping() === 'PONG' ? 'connected' : 'disconnected',
  });
});
```

### Check Active Connections

```bash
curl http://localhost:3001/health/realtime
```

## Troubleshooting

### Module Not Found Errors

```bash
# Install dependencies
pnpm install

# Build the package
pnpm --filter @atriz/realtime build
```

### Redis Connection Errors

```bash
# Check Redis is running
redis-cli ping

# Check Redis URL
echo $REDIS_URL

# View Redis logs (Docker)
docker logs redis
```

### WebSocket Not Connecting

- Check CORS origin is correct
- Verify JWT token is valid
- Check firewall/proxy settings
- Enable Socket.io debug mode:

```typescript
const socket = io(url, {
  transports: ['websocket', 'polling'],
  // Debug mode
  reconnection: true,
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

## Next Steps

1. ✅ Install dependencies: `pnpm install`
2. ✅ Setup Redis (Docker or local)
3. ✅ Configure environment variables
4. ✅ Build the package: `pnpm build`
5. ⏭️ Integrate with Mextrack API
6. ⏭️ Create tracking controller
7. ⏭️ Build frontend client
8. ⏭️ Test end-to-end
9. ⏭️ Deploy to production

## See Also

- [Real-Time Tracking Documentation](./realtime-tracking.md)
- [Database Architecture](./db.md)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Redis Documentation](https://redis.io/docs/)
