# Real-Time Tracking Architecture

## Overview

Live GPS tracking for fleet management (Mextrack) and delivery tracking (PShop) requires real-time bidirectional communication with potentially thousands of concurrent connections. This document outlines a cost-effective, scalable solution using Redis + WebSockets.

## Architecture

### Technology Stack

- **Redis**: In-memory pub/sub for real-time message distribution
- **Socket.io**: WebSocket library with fallback support and Redis adapter
- **TimescaleDB**: Persistent storage for GPS history (already implemented)
- **Express**: Existing API servers

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Real-Time Tracking Flow                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Vehicle/Driver sends GPS update                         │
│     POST /api/tracking/location                             │
│          │                                                   │
│          ▼                                                   │
│  ┌──────────────┐                                           │
│  │ API Server   │                                           │
│  │ (Express)    │                                           │
│  └──────┬───────┘                                           │
│         │                                                    │
│         ├──► 2. Publish to Redis                            │
│         │      Channel: "tracking:vehicle:123"              │
│         │      Payload: { lat, lng, speed, time }           │
│         │                                                    │
│         └──► 3. Store in TimescaleDB                        │
│              INSERT INTO location_events                    │
│                                                              │
│                                                              │
│  Redis Pub/Sub                                              │
│  ┌─────────────┐                                            │
│  │   Channel   │                                            │
│  │  Listeners  │                                            │
│  └──────┬──────┘                                            │
│         │                                                    │
│         │ 4. Broadcast to subscribers                       │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ WebSocket    │    │ WebSocket    │    │ WebSocket    │ │
│  │ Server 1     │    │ Server 2     │    │ Server N     │ │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘ │
│         │                   │                   │          │
│         │ 5. Emit to connected clients         │          │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│    Clients              Clients              Clients       │
│  (Web/Mobile)        (Web/Mobile)         (Web/Mobile)    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Cost Analysis

### Why Redis + Socket.io?

**Cost Comparison (per month):**

| Solution | 10K connections | 100K connections | Control |
|----------|----------------|------------------|---------|
| **Redis + Socket.io** | $10-20 | $50-100 | Full |
| Firebase Realtime DB | $50-100 | $500-1000 | Limited |
| Pusher | $49+ | $499+ | None |
| Ably | $29+ | $299+ | None |
| MongoDB Realm | $30+ | $300+ | Limited |

**Savings: 85-90% cheaper at scale**

### Performance Comparison

| Metric | Redis + Socket.io | Firebase | Pusher |
|--------|------------------|----------|--------|
| Latency | 5-20ms | 50-200ms | 50-150ms |
| Messages/sec | 100K+ | 10K | 10K |
| Connections/server | 10K | N/A | N/A |
| Vendor lock-in | No | Yes | Yes |

## Setup

### 1. Install Redis

**macOS (Development):**
```bash
brew install redis
brew services start redis
```

**Docker (Recommended):**
```bash
# Add to docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

**Production Options:**
- DigitalOcean Managed Redis: $15/month (1GB)
- AWS ElastiCache: $13/month (cache.t4g.micro)
- Upstash Redis: $0.20/100K commands (serverless)

### 2. Environment Variables

Add to your app `.env` files:

```env
# Redis connection
REDIS_URL=redis://localhost:6379

# WebSocket configuration
WS_CORS_ORIGIN=http://localhost:5173
WS_PING_INTERVAL=25000
WS_PING_TIMEOUT=20000
```

## Implementation

### Core Components

1. **RealtimeServer** - Socket.io server with Redis adapter
2. **TrackingService** - GPS update publishing and caching
3. **AuthMiddleware** - JWT verification for WebSocket connections
4. **Controllers** - API endpoints for GPS updates

### Client Usage

**React/TypeScript Hook:**
```typescript
const { location, connected } = useVehicleTracking(vehicleId, token);
```

**Mobile (React Native):**
```typescript
const socket = useRealtimeConnection(authToken);
socket.trackVehicle(vehicleId);
```

## Scaling Strategy

### Single Server Capacity
- **Connections**: ~10,000 concurrent WebSocket connections
- **Memory**: ~10KB per connection = 100MB for 10K connections
- **CPU**: Minimal (event-driven I/O)

### Horizontal Scaling

```
Load Balancer (with sticky sessions)
     │
     ├──► Server 1 (10K connections) ─┐
     ├──► Server 2 (10K connections) ─┼──► Redis Pub/Sub
     └──► Server 3 (10K connections) ─┘
```

**Capacity: 30,000 connections**

**Cost:**
- 3x DigitalOcean Droplets ($24/month): $72
- 1x Redis Managed ($15/month): $15
- 1x Load Balancer ($12/month): $12
- **Total: $99/month**

**vs Firebase for 30K connections: $800-1200/month**

## Performance Optimizations

### 1. Message Throttling

Limit GPS updates to prevent flooding:

```typescript
// Server-side: Max 1 update per second per vehicle
const throttleMap = new Map<string, number>();

function shouldProcess(vehicleId: string): boolean {
  const last = throttleMap.get(vehicleId) || 0;
  const now = Date.now();
  
  if (now - last < 1000) return false;
  
  throttleMap.set(vehicleId, now);
  return true;
}
```

### 2. Client-Side Batching

Reduce server requests:

```typescript
// Mobile app: Batch GPS updates every 5 seconds
const buffer: GPSUpdate[] = [];

setInterval(() => {
  if (buffer.length > 0) {
    api.post('/tracking/batch', { updates: buffer });
    buffer.length = 0;
  }
}, 5000);
```

### 3. Room-Based Broadcasting

Only notify interested clients:

```typescript
// Broadcast only to subscribers of specific vehicle
io.to(`vehicle:${vehicleId}`).emit('location:update', data);
```

### 4. Redis Caching

Cache last known location (5-minute TTL):

```typescript
await redis.setex(
  `location:current:vehicle:${vehicleId}`,
  300,
  JSON.stringify(location)
);
```

## Monitoring

### Key Metrics

```typescript
// Active connections
io.engine.clientsCount

// Active tracking rooms
io.sockets.adapter.rooms.size

// Redis operations/sec
redis.info('stats')

// Memory usage
redis.info('memory')
```

### Health Check Endpoint

```typescript
app.get('/health/realtime', async (req, res) => {
  const connections = io.engine.clientsCount;
  const rooms = io.sockets.adapter.rooms.size;
  const redisHealth = await redis.ping();
  
  res.json({
    status: 'healthy',
    connections,
    rooms,
    redis: redisHealth === 'PONG' ? 'connected' : 'disconnected',
  });
});
```

## Data Lifecycle

### Real-Time Data Flow

1. **Vehicle sends GPS** → API Server
2. **API stores in TimescaleDB** (persistent, 30-day retention)
3. **API publishes to Redis** (ephemeral, for real-time broadcast)
4. **Redis broadcasts to WebSocket servers**
5. **WebSocket emits to connected clients**

### Data Retention

| Data Type | Storage | Retention | Purpose |
|-----------|---------|-----------|---------|
| Real-time updates | Redis cache | 5 minutes | Current location |
| Raw GPS points | TimescaleDB | 30 days | History, playback |
| Hourly aggregates | TimescaleDB | 1 year | Analytics |
| WebSocket messages | Memory only | N/A | Live updates |

## Security

### Authentication

```typescript
// Client connects with JWT token
const socket = io(WS_URL, {
  auth: { token: userToken }
});

// Server validates token
socket.on('authenticate', async (token) => {
  const userId = await verifyJWT(token);
  socket.data.userId = userId;
});
```

### Authorization

```typescript
// Check user can track this vehicle
socket.on('track:vehicle', async (vehicleId) => {
  const hasAccess = await checkVehicleAccess(
    socket.data.userId,
    vehicleId
  );
  
  if (!hasAccess) {
    return socket.emit('error', 'Unauthorized');
  }
  
  socket.join(`vehicle:${vehicleId}`);
});
```

## Alternative: Server-Sent Events (SSE)

For simpler one-way streaming:

**Pros:**
- Uses HTTP (no WebSocket complexity)
- Auto-reconnect built-in
- Simpler than Socket.io

**Cons:**
- One-way only (server → client)
- No client-to-server real-time
- Less efficient

**Use SSE if:**
- You only need server → client updates
- Simpler infrastructure preferred
- WebSocket proxies are problematic

**Use WebSockets if:**
- Bidirectional needed (chat, commands)
- Maximum performance required
- Scaling to 10K+ connections

## Troubleshooting

### High Memory Usage

```bash
# Check Socket.io connections
curl http://localhost:3001/health/realtime

# Check Redis memory
redis-cli info memory

# Restart if needed
pm2 restart mextrack-api
```

### Connection Drops

```typescript
// Client-side auto-reconnect
const socket = io(WS_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

socket.on('reconnect', () => {
  // Re-subscribe to tracking
  socket.emit('track:vehicle', vehicleId);
});
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping

# Check Redis logs
docker logs redis

# Verify connection string
echo $REDIS_URL
```

## Cost Projections

### Scenario: 1,000 active vehicles + 5,000 tracking users

| Component | Specs | Monthly Cost |
|-----------|-------|--------------|
| API Servers (3x) | 4GB RAM | $72 |
| Redis Managed | 1GB | $15 |
| TimescaleDB | 25GB | $15 |
| Load Balancer | Standard | $12 |
| **Total** | | **$114/month** |

**Same with Firebase: $800-1,200/month**
**Savings: ~$900/month (87% cheaper)**

### Break-Even Analysis

| Users/Vehicles | Self-Hosted | Firebase | Savings |
|----------------|-------------|----------|---------|
| 1K / 5K | $114 | $800 | $686 |
| 10K / 50K | $240 | $3,500 | $3,260 |
| 50K / 250K | $680 | $15,000 | $14,320 |

## Summary

**Recommended for Atriz:**
- ✅ Redis + Socket.io for real-time tracking
- ✅ TimescaleDB for GPS persistence
- ✅ 85-90% cost savings vs managed services
- ✅ Full control and flexibility
- ✅ Scales to 100K+ connections

**Next Steps:**
1. Install Redis (Docker or managed)
2. Create `@atriz/realtime` package
3. Integrate with Mextrack/PShop APIs
4. Build client-side hooks
5. Deploy and monitor

---

**Last Updated:** 2025-10-26  
**Maintainer:** Atriz Development Team
