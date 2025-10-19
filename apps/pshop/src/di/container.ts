import 'reflect-metadata';
import { container, registerSingleton, registerInstance } from '@atriz/core';
import { JWTService, PasswordService, AUTH_TOKENS } from '@atriz/auth';
import { getEnv } from '@atriz/core';

/**
 * Setup and configure the DI container for PShop
 */
export function setupContainer(): void {
    // Register Auth services
    const jwtService = new JWTService(getEnv('JWT_SECRET'), getEnv('JWT_EXPIRES_IN', '7d'));
    registerInstance(AUTH_TOKENS.JWTService, jwtService);

    const passwordService = new PasswordService();
    registerInstance(AUTH_TOKENS.PasswordService, passwordService);

    // TODO: Register PShop-specific services
    // Example:
    // registerSingleton(PSHOP_TOKENS.ProductService, ProductService);
    // registerSingleton(PSHOP_TOKENS.SaleService, SaleService);
    // registerSingleton(PSHOP_TOKENS.InventoryService, InventoryService);
    // registerSingleton(PSHOP_TOKENS.PaymentService, PaymentService);
}

export { container };
