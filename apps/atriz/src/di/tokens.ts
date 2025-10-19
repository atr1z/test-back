/**
 * Application-specific DI tokens
 */

export const APP_TOKENS = {
    // Define your app-specific tokens here
    // Example:
    // UserRepository: Symbol.for('UserRepository'),
    // PostService: Symbol.for('PostService'),
} as const;

export type AppTokenType = (typeof APP_TOKENS)[keyof typeof APP_TOKENS];
