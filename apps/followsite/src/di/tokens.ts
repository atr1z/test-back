/**
 * Application-specific DI tokens
 */

export const APP_TOKENS = {} as const;

export type AppTokenType = (typeof APP_TOKENS)[keyof typeof APP_TOKENS];
