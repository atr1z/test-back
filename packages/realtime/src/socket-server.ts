import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Server as HTTPServer } from 'http';
import {
  RealtimeConfig,
  SocketEvents,
  AuthenticationResponse,
  SocketData,
  Rooms,
} from './types';

/**
 * WebSocket server with Redis adapter for horizontal scaling
 * 
 * Features:
 * - Socket.io with Redis pub/sub adapter
 * - JWT authentication
 * - Room-based broadcasting
 * - Connection management
 * 
 * @example
 * ```typescript
 * const realtimeServer = new RealtimeServer(httpServer, {
 *   redisUrl: 'redis://localhost:6379',
 *   corsOrigin: 'http://localhost:5173',
 * });
 * ```
 */
export class RealtimeServer {
  private io: SocketIOServer;
  private pubClient: Redis;
  private subClient: Redis;
  private config: RealtimeConfig;

  constructor(httpServer: HTTPServer, config: RealtimeConfig) {
    this.config = config;

    // Initialize Redis clients for pub/sub
    this.pubClient = new Redis(config.redisUrl);
    this.subClient = this.pubClient.duplicate();

    // Initialize Socket.io with Redis adapter
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.corsOrigin,
        credentials: true,
      },
      // Performance optimizations
      transports: ['websocket', 'polling'],
      pingInterval: config.pingInterval ?? 25000,
      pingTimeout: config.pingTimeout ?? 20000,
      // Connection state recovery
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      },
    });

    // Use Redis adapter for multi-server scaling
    this.io.adapter(createAdapter(this.pubClient, this.subClient));

    // Setup event handlers
    this.setupEventHandlers();
    this.setupErrorHandlers();

    console.log('✓ Realtime server initialized');
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`[WebSocket] Client connected: ${socket.id}`);

      // Initialize socket data
      socket.data = {
        authenticated: false,
        connectedAt: new Date(),
      } as SocketData;

      // Authentication
      socket.on(SocketEvents.AUTHENTICATE, async (token: string) => {
        try {
          const userId = await this.verifyToken(token);
          socket.data.userId = userId;
          socket.data.authenticated = true;

          // Join user's personal room
          socket.join(Rooms.user(userId));

          const response: AuthenticationResponse = { success: true };
          socket.emit(SocketEvents.AUTHENTICATED, response);

          console.log(`[WebSocket] User ${userId} authenticated`);
        } catch (error) {
          const response: AuthenticationResponse = {
            success: false,
            message: 'Authentication failed',
          };
          socket.emit(SocketEvents.AUTHENTICATED, response);
          socket.disconnect();
          
          console.error(`[WebSocket] Authentication failed:`, error);
        }
      });

      // Track vehicle
      socket.on(SocketEvents.TRACK_VEHICLE, async (vehicleId: string) => {
        if (!socket.data.authenticated) {
          socket.emit(SocketEvents.ERROR, 'Not authenticated');
          return;
        }

        // TODO: Verify user has access to this vehicle
        // const hasAccess = await this.checkVehicleAccess(socket.data.userId!, vehicleId);
        // if (!hasAccess) {
        //   socket.emit(SocketEvents.ERROR, 'Unauthorized');
        //   return;
        // }

        socket.join(Rooms.vehicle(vehicleId));
        console.log(`[WebSocket] User ${socket.data.userId} tracking vehicle ${vehicleId}`);
      });

      // Untrack vehicle
      socket.on(SocketEvents.UNTRACK_VEHICLE, (vehicleId: string) => {
        socket.leave(Rooms.vehicle(vehicleId));
        console.log(`[WebSocket] User ${socket.data.userId} stopped tracking vehicle ${vehicleId}`);
      });

      // Track delivery
      socket.on(SocketEvents.TRACK_DELIVERY, async (deliveryId: string) => {
        if (!socket.data.authenticated) {
          socket.emit(SocketEvents.ERROR, 'Not authenticated');
          return;
        }

        // TODO: Verify user has access to this delivery
        socket.join(Rooms.delivery(deliveryId));
        console.log(`[WebSocket] User ${socket.data.userId} tracking delivery ${deliveryId}`);
      });

      // Untrack delivery
      socket.on(SocketEvents.UNTRACK_DELIVERY, (deliveryId: string) => {
        socket.leave(Rooms.delivery(deliveryId));
        console.log(`[WebSocket] User ${socket.data.userId} stopped tracking delivery ${deliveryId}`);
      });

      // Disconnect
      socket.on('disconnect', (reason) => {
        console.log(`[WebSocket] Client disconnected: ${socket.id} (${reason})`);
      });
    });
  }

  /**
   * Setup error handlers
   */
  private setupErrorHandlers() {
    this.io.engine.on('connection_error', (err) => {
      console.error('[WebSocket] Connection error:', err);
    });

    this.pubClient.on('error', (err) => {
      console.error('[Redis Pub] Connection error:', err);
    });

    this.subClient.on('error', (err) => {
      console.error('[Redis Sub] Connection error:', err);
    });
  }

  /**
   * Verify JWT token and return user ID
   * @param token - JWT token
   * @returns User ID
   */
  private async verifyToken(token: string): Promise<string> {
    // TODO: Implement JWT verification
    // For now, this is a placeholder
    // In production, verify against JWT_SECRET and check expiration
    
    if (!token || token.length === 0) {
      throw new Error('Invalid token');
    }

    // Parse JWT and verify signature
    // const decoded = jwt.verify(token, this.config.jwtSecret);
    // return decoded.userId;

    // Placeholder - replace with actual JWT verification
    return 'user-123';
  }

  /**
   * Emit location update to specific room
   * @param channel - Room/channel name
   * @param data - Location data
   */
  public emitLocationUpdate(channel: string, data: any) {
    this.io.to(channel).emit(SocketEvents.LOCATION_UPDATE, data);
  }

  /**
   * Get number of connected clients
   */
  public get connectionCount(): number {
    return this.io.engine.clientsCount;
  }

  /**
   * Get number of active rooms
   */
  public get roomCount(): number {
    return this.io.sockets.adapter.rooms.size;
  }

  /**
   * Get Redis pub client
   */
  public get redis(): Redis {
    return this.pubClient;
  }

  /**
   * Get Socket.io server instance
   */
  public get socketIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Close server and disconnect all clients
   */
  public async close(): Promise<void> {
    console.log('[WebSocket] Closing realtime server...');

    // Close all socket connections
    this.io.close();

    // Close Redis connections
    await this.pubClient.quit();
    await this.subClient.quit();

    console.log('✓ Realtime server closed');
  }

  /**
   * Get server statistics
   */
  public getStats() {
    return {
      connections: this.connectionCount,
      rooms: this.roomCount,
      uptime: process.uptime(),
    };
  }
}
