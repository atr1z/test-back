/**
 * Client-side WebSocket integration example
 *
 * This example shows how to connect to the realtime server
 * from a client application (React, Vue, Angular, etc.)
 */

// Note: socket.io-client is a client-side dependency
// Install it in your client application: npm install socket.io-client
// import { io, Socket } from 'socket.io-client';

// For this example, we'll define the types manually
type Socket = any; // Replace with actual Socket type from socket.io-client
import {
    SocketEvents,
    LocationUpdateEvent,
    AuthenticationResponse,
} from '../types/index.js';

/**
 * WebSocket client for live tracking
 */
export class TrackingClient {
    private socket: Socket;
    private isAuthenticated: boolean = false;
    private onLocationUpdate?: (data: LocationUpdateEvent) => void;
    private onAuthentication?: (response: AuthenticationResponse) => void;

    constructor(serverUrl: string) {
        // Note: In a real application, you would import and use socket.io-client
        // this.socket = io(serverUrl, {
        //   transports: ['websocket', 'polling'],
        //   autoConnect: false,
        // });

        // For this example, we'll create a mock socket
        this.socket = {
            connect: () => console.log('Mock: Connecting to', serverUrl),
            disconnect: () => console.log('Mock: Disconnecting'),
            emit: (event: string, data: any) =>
                console.log('Mock: Emitting', event, data),
            on: (event: string, _callback: Function) =>
                console.log('Mock: Listening to', event),
            connected: false,
        } as any;

        this.setupEventHandlers();
    }

    /**
     * Setup event handlers
     */
    private setupEventHandlers() {
        // Connection events
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('disconnect', (reason: any) => {
            console.log('Disconnected from server:', reason);
            this.isAuthenticated = false;
        });

        // Authentication response
        this.socket.on(
            SocketEvents.AUTHENTICATED,
            (response: AuthenticationResponse) => {
                this.isAuthenticated = response.success;
                console.log('Authentication result:', response);

                if (this.onAuthentication) {
                    this.onAuthentication(response);
                }
            }
        );

        // Location updates
        this.socket.on(
            SocketEvents.LOCATION_UPDATE,
            (data: LocationUpdateEvent) => {
                console.log('Location update received:', data);

                if (this.onLocationUpdate) {
                    this.onLocationUpdate(data);
                }
            }
        );

        // Error handling
        this.socket.on(SocketEvents.ERROR, (error: string) => {
            console.error('WebSocket error:', error);
        });
    }

    /**
     * Connect to the server
     */
    public connect(): void {
        this.socket.connect();
    }

    /**
     * Disconnect from the server
     */
    public disconnect(): void {
        this.socket.disconnect();
    }

    /**
     * Authenticate with JWT token
     * @param token - JWT token
     */
    public authenticate(token: string): void {
        if (!this.socket.connected) {
            console.error('Socket not connected');
            return;
        }

        this.socket.emit(SocketEvents.AUTHENTICATE, token);
    }

    /**
     * Start tracking a vehicle
     * @param vehicleId - Vehicle ID to track
     */
    public trackVehicle(vehicleId: string): void {
        if (!this.isAuthenticated) {
            console.error('Not authenticated');
            return;
        }

        this.socket.emit(SocketEvents.TRACK_VEHICLE, vehicleId);
        console.log(`Started tracking vehicle: ${vehicleId}`);
    }

    /**
     * Stop tracking a vehicle
     * @param vehicleId - Vehicle ID to stop tracking
     */
    public untrackVehicle(vehicleId: string): void {
        this.socket.emit(SocketEvents.UNTRACK_VEHICLE, vehicleId);
        console.log(`Stopped tracking vehicle: ${vehicleId}`);
    }

    /**
     * Start tracking a delivery
     * @param deliveryId - Delivery ID to track
     */
    public trackDelivery(deliveryId: string): void {
        if (!this.isAuthenticated) {
            console.error('Not authenticated');
            return;
        }

        this.socket.emit(SocketEvents.TRACK_DELIVERY, deliveryId);
        console.log(`Started tracking delivery: ${deliveryId}`);
    }

    /**
     * Stop tracking a delivery
     * @param deliveryId - Delivery ID to stop tracking
     */
    public untrackDelivery(deliveryId: string): void {
        this.socket.emit(SocketEvents.UNTRACK_DELIVERY, deliveryId);
        console.log(`Stopped tracking delivery: ${deliveryId}`);
    }

    /**
     * Set callback for location updates
     * @param callback - Function to call when location updates are received
     */
    public onLocationUpdateCallback(
        callback: (data: LocationUpdateEvent) => void
    ): void {
        this.onLocationUpdate = callback;
    }

    /**
     * Set callback for authentication responses
     * @param callback - Function to call when authentication completes
     */
    public onAuthenticationCallback(
        callback: (response: AuthenticationResponse) => void
    ): void {
        this.onAuthentication = callback;
    }

    /**
     * Check if client is authenticated
     */
    public get authenticated(): boolean {
        return this.isAuthenticated;
    }

    /**
     * Check if socket is connected
     */
    public get connected(): boolean {
        return this.socket.connected;
    }
}

// Example usage in a React component
export const useTrackingClient = (serverUrl: string) => {
    const client = new TrackingClient(serverUrl);

    // Example: Connect and authenticate
    const connectAndAuthenticate = (token: string) => {
        client.connect();

        client.onAuthenticationCallback(response => {
            if (response.success) {
                console.log('Successfully authenticated');
                // Start tracking vehicles or deliveries
                // client.trackVehicle('vehicle-123');
            } else {
                console.error('Authentication failed:', response.message);
            }
        });

        client.authenticate(token);
    };

    // Example: Track vehicle with location updates
    const trackVehicle = (
        vehicleId: string,
        onLocationUpdate: (data: LocationUpdateEvent) => void
    ) => {
        client.onLocationUpdateCallback(onLocationUpdate);
        client.trackVehicle(vehicleId);
    };

    return {
        client,
        connectAndAuthenticate,
        trackVehicle,
        trackDelivery: client.trackDelivery.bind(client),
        untrackVehicle: client.untrackVehicle.bind(client),
        untrackDelivery: client.untrackDelivery.bind(client),
        disconnect: client.disconnect.bind(client),
        connected: client.connected,
        authenticated: client.authenticated,
    };
};

// Example usage in vanilla JavaScript/TypeScript
export const exampleUsage = () => {
    const client = new TrackingClient('http://localhost:3000');

    // Connect to server
    client.connect();

    // Set up location update handler
    client.onLocationUpdateCallback(data => {
        console.log('Vehicle location:', data);

        // Update your map or UI here
        if (data.type === 'vehicle') {
            updateVehicleOnMap(data.entityId, data.location);
        } else if (data.type === 'delivery') {
            updateDeliveryOnMap(data.entityId, data.location);
        }
    });

    // Set up authentication handler
    client.onAuthenticationCallback(response => {
        if (response.success) {
            console.log('Authenticated successfully');

            // Start tracking vehicles
            client.trackVehicle('vehicle-123');
            client.trackVehicle('vehicle-456');

            // Start tracking deliveries
            client.trackDelivery('delivery-789');
        } else {
            console.error('Authentication failed:', response.message);
        }
    });

    // Authenticate with JWT token
    const token = localStorage.getItem('authToken');
    if (token) {
        client.authenticate(token);
    }

    // Cleanup on page unload (only in browser environment)
    if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
        (globalThis as any).window.addEventListener('beforeunload', () => {
            client.disconnect();
        });
    }
};

// Mock functions for example
const updateVehicleOnMap = (vehicleId: string, location: any) => {
    console.log(`Update vehicle ${vehicleId} on map:`, location);
};

const updateDeliveryOnMap = (deliveryId: string, location: any) => {
    console.log(`Update delivery ${deliveryId} on map:`, location);
};
