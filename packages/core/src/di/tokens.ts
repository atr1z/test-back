/**
 * Dependency Injection tokens
 * Define your service tokens here for type-safe DI
 */

export const TOKENS = {
    // Core services
    Config: Symbol.for('Config'),
    Logger: Symbol.for('Logger'),

    // Authentication services
    JWTService: Symbol.for('JWTService'),
    PasswordService: Symbol.for('PasswordService'),

    // Storage services
    StorageProvider: Symbol.for('StorageProvider'),
    StorageService: Symbol.for('StorageService'),
} as const;

export type TokenType = (typeof TOKENS)[keyof typeof TOKENS];
