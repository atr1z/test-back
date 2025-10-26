import Redis from 'ioredis';
import { Server as SocketIOServer } from 'socket.io';
import {
  LocationUpdate,
  TrackingType,
  LocationUpdateEvent,
  RedisChannels,
  CacheTTL,
  Rooms,
  SocketEvents,
} from './types';

/**
 * GPS tracking service for real-time location updates
 * 
 * Responsibilities:
 * - Publish location updates to Redis pub/sub
 * - Broadcast updates to WebSocket clients
 * - Cache current locations in Redis
 * - Subscribe to location updates
 * 
 * @example
 * ```typescript
 * const trackingService = new TrackingService(redis, socketIO);
 * 
 * await trackingService.publishLocationUpdate('vehicle', vehicleId, {
 *   deviceId: vehicleId,
 *   userId: userId,
 *   latitude: 40.7128,
 *   longitude: -74.0060,
 *   speed: 65,
 *   timestamp: new Date(),
 * });
 * ```
 */
export class TrackingService {
  private redis: Redis;
  private io: SocketIOServer;

  constructor(redis: Redis, io: SocketIOServer) {
    this.redis = redis;
    this.io = io;
  }

  /**
   * Publish GPS location update and broadcast to subscribers
   * 
   * @param type - Type of entity (vehicle or delivery)
   * @param entityId - Vehicle or delivery ID
   * @param location - GPS location data
   */
  async publishLocationUpdate(
    type: TrackingType,
    entityId: string,
    location: LocationUpdate
  ): Promise<void> {
    const channel = `${RedisChannels.TRACKING}${type}:${entityId}`;
    const room = type === 'vehicle' 
      ? Rooms.vehicle(entityId) 
      : Rooms.delivery(entityId);

    const event: LocationUpdateEvent = {
      type,
      entityId,
      location,
    };

    try {
      // 1. Publish to Redis for other server instances
      await this.redis.publish(channel, JSON.stringify(event));

      // 2. Broadcast to connected clients on this server
      this.io.to(room).emit(SocketEvents.LOCATION_UPDATE, event);

      // 3. Cache current location
      await this.cacheCurrentLocation(type, entityId, location);

      console.log(`[Tracking] Published ${type} ${entityId} location update`);
    } catch (error) {
      console.error(`[Tracking] Failed to publish location update:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to location updates from Redis pub/sub
   * Useful for server-side processing of location data
   * 
   * @param callback - Callback function for each location update
   * @returns Redis subscriber client
   * 
   * @example
   * ```typescript
   * const subscriber = trackingService.subscribeToLocationUpdates((channel, data) => {
   *   console.log('Location update:', data);
   * });
   * ```
   */
  subscribeToLocationUpdates(
    callback: (channel: string, data: LocationUpdateEvent) => void
  ): Redis {
    const subscriber = this.redis.duplicate();

    // Subscribe to all tracking channels
    subscriber.psubscribe(`${RedisChannels.TRACKING}*`, (err) => {
      if (err) {
        console.error('[Tracking] Failed to subscribe:', err);
        return;
      }
      console.log('[Tracking] Subscribed to location updates');
    });

    // Handle incoming messages
    subscriber.on('pmessage', (pattern, channel, message) => {
      try {
        const data: LocationUpdateEvent = JSON.parse(message);
        callback(channel, data);
      } catch (error) {
        console.error('[Tracking] Failed to parse location update:', error);
      }
    });

    return subscriber;
  }

  /**
   * Get current cached location for a vehicle or delivery
   * 
   * @param type - Type of entity
   * @param entityId - Vehicle or delivery ID
   * @returns Current location or null if not cached
   */
  async getCurrentLocation(
    type: TrackingType,
    entityId: string
  ): Promise<LocationUpdate | null> {
    const key = `${RedisChannels.CURRENT_LOCATION}${type}:${entityId}`;

    try {
      const data = await this.redis.get(key);
      
      if (!data) {
        return null;
      }

      const location: LocationUpdate = JSON.parse(data);
      return location;
    } catch (error) {
      console.error('[Tracking] Failed to get current location:', error);
      return null;
    }
  }

  /**
   * Cache current location in Redis with TTL
   * 
   * @param type - Type of entity
   * @param entityId - Vehicle or delivery ID
   * @param location - GPS location data
   */
  async cacheCurrentLocation(
    type: TrackingType,
    entityId: string,
    location: LocationUpdate
  ): Promise<void> {
    const key = `${RedisChannels.CURRENT_LOCATION}${type}:${entityId}`;

    try {
      await this.redis.setex(
        key,
        CacheTTL.CURRENT_LOCATION,
        JSON.stringify(location)
      );
    } catch (error) {
      console.error('[Tracking] Failed to cache current location:', error);
      throw error;
    }
  }

  /**
   * Get all cached vehicle locations
   * Useful for map overview showing all active vehicles
   * 
   * @returns Map of vehicle IDs to locations
   */
  async getAllVehicleLocations(): Promise<Map<string, LocationUpdate>> {
    const pattern = `${RedisChannels.CURRENT_LOCATION}vehicle:*`;
    const locations = new Map<string, LocationUpdate>();

    try {
      // Scan for all vehicle location keys
      const keys = await this.redis.keys(pattern);

      // Get all locations in parallel
      const values = await Promise.all(
        keys.map(key => this.redis.get(key))
      );

      // Parse and map
      keys.forEach((key, index) => {
        const vehicleId = key.split(':').pop()!;
        const data = values[index];
        
        if (data) {
          try {
            locations.set(vehicleId, JSON.parse(data));
          } catch (error) {
            console.error(`[Tracking] Failed to parse location for ${vehicleId}`);
          }
        }
      });

      return locations;
    } catch (error) {
      console.error('[Tracking] Failed to get all vehicle locations:', error);
      return locations;
    }
  }

  /**
   * Clear cached location for an entity
   * 
   * @param type - Type of entity
   * @param entityId - Vehicle or delivery ID
   */
  async clearCurrentLocation(
    type: TrackingType,
    entityId: string
  ): Promise<void> {
    const key = `${RedisChannels.CURRENT_LOCATION}${type}:${entityId}`;

    try {
      await this.redis.del(key);
      console.log(`[Tracking] Cleared location for ${type} ${entityId}`);
    } catch (error) {
      console.error('[Tracking] Failed to clear location:', error);
      throw error;
    }
  }

  /**
   * Get statistics about active tracking
   */
  async getTrackingStats() {
    try {
      const vehiclePattern = `${RedisChannels.CURRENT_LOCATION}vehicle:*`;
      const deliveryPattern = `${RedisChannels.CURRENT_LOCATION}delivery:*`;

      const [vehicleKeys, deliveryKeys] = await Promise.all([
        this.redis.keys(vehiclePattern),
        this.redis.keys(deliveryPattern),
      ]);

      return {
        activeVehicles: vehicleKeys.length,
        activeDeliveries: deliveryKeys.length,
        totalTracking: vehicleKeys.length + deliveryKeys.length,
      };
    } catch (error) {
      console.error('[Tracking] Failed to get tracking stats:', error);
      return {
        activeVehicles: 0,
        activeDeliveries: 0,
        totalTracking: 0,
      };
    }
  }
}
