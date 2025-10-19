/**
 * Mextrack-specific DI tokens
 */

export const MEXTRACK_TOKENS = {
    // Vehicle Management
    VehicleService: Symbol.for('VehicleService'),
    VehicleRepository: Symbol.for('VehicleRepository'),

    // Tracking
    TrackingService: Symbol.for('TrackingService'),
    TrackingRepository: Symbol.for('TrackingRepository'),

    // Geofencing (future)
    GeofenceService: Symbol.for('GeofenceService'),
    GeofenceRepository: Symbol.for('GeofenceRepository'),

    // Alerts (future)
    AlertService: Symbol.for('AlertService'),
    AlertRepository: Symbol.for('AlertRepository'),

    // Reports (future)
    ReportService: Symbol.for('ReportService'),

    // WebSocket (future)
    WebSocketService: Symbol.for('WebSocketService'),
} as const;

export type MextrackTokenType = (typeof MEXTRACK_TOKENS)[keyof typeof MEXTRACK_TOKENS];
