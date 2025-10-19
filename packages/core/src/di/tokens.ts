/**
 * Dependency Injection tokens
 * Define your service tokens here for type-safe DI
 */

export const TOKENS = {
    // Core tokens
    Config: Symbol.for('Config'),
    Logger: Symbol.for('Logger'),

    // Add your custom tokens here
    // Example:
    // UserService: Symbol.for('UserService'),
    // EmailService: Symbol.for('EmailService'),
} as const;

export type TokenType = (typeof TOKENS)[keyof typeof TOKENS];
