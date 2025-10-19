import 'reflect-metadata';
import { container, registerSingleton, registerInstance } from '@atriz/core';
import { JWTService, PasswordService, AUTH_TOKENS } from '@atriz/auth';
import { getEnv } from '@atriz/core';

/**
 * Setup and configure the DI container
 */
export function setupContainer(): void {
    // Register Auth services
    const jwtService = new JWTService(getEnv('JWT_SECRET'), getEnv('JWT_EXPIRES_IN', '7d'));
    registerInstance(AUTH_TOKENS.JWTService, jwtService);

    const passwordService = new PasswordService();
    registerInstance(AUTH_TOKENS.PasswordService, passwordService);

    // Add your custom service registrations here
    // Example:
    // registerSingleton('UserService', UserService);
    // registerSingleton('EmailService', EmailService);
}

export { container };
