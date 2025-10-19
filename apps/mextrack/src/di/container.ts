import 'reflect-metadata';
import { container, registerSingleton, registerInstance } from '@atriz/core';
import { JWTService, PasswordService, AUTH_TOKENS } from '@atriz/auth';
import { getEnv } from '@atriz/core';

/**
 * Setup and configure the DI container for Mextrack
 */
export function setupContainer(): void {
    // Register Auth services
    const jwtService = new JWTService(getEnv('JWT_SECRET'), getEnv('JWT_EXPIRES_IN', '7d'));
    registerInstance(AUTH_TOKENS.JWTService, jwtService);

    const passwordService = new PasswordService();
    registerInstance(AUTH_TOKENS.PasswordService, passwordService);

    // TODO: Register Mextrack-specific services
    // Example:
    // registerSingleton(MEXTRACK_TOKENS.VehicleService, VehicleService);
    // registerSingleton(MEXTRACK_TOKENS.TrackingService, TrackingService);
    // registerSingleton(MEXTRACK_TOKENS.GeofenceService, GeofenceService);
}

export { container };
