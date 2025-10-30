import { Server as SocketIOServer } from 'socket.io';
import Redis from 'ioredis';

/**
 * Configuration for the realtime server
 */
export interface RealtimeConfig {
    /** Redis connection URL */
    redisUrl: string;
    /** CORS origin for WebSocket connections */
    corsOrigin: string;
    /** JWT secret for authentication (optional) */
    jwtSecret?: string;
    /** Ping interval in milliseconds (default: 25000) */
    pingInterval?: number;
    /** Ping timeout in milliseconds (default: 20000) */
    pingTimeout?: number;
}

/**
 * GPS location update data
 */
export interface LocationUpdate {
    /** Device/Vehicle ID */
    deviceId: string;
    /** User ID */
    userId: string;
    /** Latitude (-90 to 90) */
    latitude: number;
    /** Longitude (-180 to 180) */
    longitude: number;
    /** Speed in km/h */
    speed?: number;
    /** Heading in degrees (0-360) */
    heading?: number;
    /** GPS accuracy in meters */
    accuracy?: number;
    /** Altitude in meters */
    altitude?: number;
    /** Timestamp of the location update */
    timestamp: Date;
    /** Additional metadata */
    metadata?: Record<string, any>;
}

/**
 * Type of tracking entity
 */
export type TrackingType = 'vehicle' | 'delivery';

/**
 * Socket.io event names
 */
export enum SocketEvents {
    // Client → Server
    AUTHENTICATE = 'authenticate',
    TRACK_VEHICLE = 'track:vehicle',
    UNTRACK_VEHICLE = 'untrack:vehicle',
    TRACK_DELIVERY = 'track:delivery',
    UNTRACK_DELIVERY = 'untrack:delivery',

    // Server → Client
    AUTHENTICATED = 'authenticated',
    LOCATION_UPDATE = 'location:update',
    ERROR = 'error',
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
}

/**
 * Authentication response
 */
export interface AuthenticationResponse {
    success: boolean;
    message?: string;
}

/**
 * Location update event payload
 */
export interface LocationUpdateEvent {
    type: TrackingType;
    entityId: string;
    location: LocationUpdate;
}

/**
 * Socket data stored in socket.data
 */
export interface SocketData {
    userId?: string;
    authenticated: boolean;
    connectedAt: Date;
}

/**
 * Extended Socket type with custom data
 */
export interface CustomSocket {
    id: string;
    data: SocketData;
    emit: (event: string, ...args: any[]) => boolean;
    join: (room: string) => void;
    leave: (room: string) => void;
    disconnect: () => void;
}

/**
 * Tracking service dependencies
 */
export interface TrackingServiceDeps {
    redis: Redis;
    io: SocketIOServer;
}

/**
 * Redis channel patterns
 */
export const RedisChannels = {
    TRACKING: 'tracking:',
    VEHICLE: 'vehicle:',
    DELIVERY: 'delivery:',
    CURRENT_LOCATION: 'location:current:',
} as const;

/**
 * Cache TTL values (in seconds)
 */
export const CacheTTL = {
    CURRENT_LOCATION: 300, // 5 minutes
    SESSION: 3600, // 1 hour
} as const;

/**
 * Room name generators
 */
export const Rooms = {
    vehicle: (vehicleId: string) => `vehicle:${vehicleId}`,
    delivery: (deliveryId: string) => `delivery:${deliveryId}`,
    user: (userId: string) => `user:${userId}`,
} as const;
