import 'reflect-metadata';
import {
    container,
    registerInstance,
    TOKENS,
    getEnv,
    JWTService,
    PasswordService,
} from '@atriz/core';

/**
 * Setup and configure the DI container
 */
export function setupContainer(): void {
    // Register Auth services
    const jwtService = new JWTService(
        getEnv('JWT_SECRET'),
        getEnv('JWT_EXPIRES_IN', '7d')
    );
    registerInstance(TOKENS.JWTService, jwtService);

    const passwordService = new PasswordService();
    registerInstance(TOKENS.PasswordService, passwordService);
}

export { container };
