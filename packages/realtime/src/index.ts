/**
 * @atriz/realtime - Real-time communication utilities
 * 
 * Features:
 * - WebSocket server with Socket.io
 * - Redis pub/sub for horizontal scaling
 * - GPS tracking service
 * - Authentication and authorization
 * - Room-based broadcasting
 * 
 * @example
 * ```typescript
 * import { RealtimeServer, TrackingService } from '@atriz/realtime';
 * 
 * const realtimeServer = new RealtimeServer(httpServer, {
 *   redisUrl: process.env.REDIS_URL,
 *   corsOrigin: process.env.CORS_ORIGIN,
 * });
 * 
 * const trackingService = new TrackingService(
 *   realtimeServer.redis,
 *   realtimeServer.socketIO
 * );
 * ```
 */

// Core classes
export { RealtimeServer } from './socket-server';
export { TrackingService } from './tracking';

// Types and interfaces
export type {
  RealtimeConfig,
  LocationUpdate,
  TrackingType,
  LocationUpdateEvent,
  SocketData,
  CustomSocket,
  TrackingServiceDeps,
  AuthenticationResponse,
} from './types';

// Enums and constants
export {
  SocketEvents,
  RedisChannels,
  CacheTTL,
  Rooms,
} from './types';
