/**
 * Auth package DI tokens
 */

export const AUTH_TOKENS = {
    JWTService: Symbol.for('JWTService'),
    PasswordService: Symbol.for('PasswordService'),
} as const;

export type AuthTokenType = (typeof AUTH_TOKENS)[keyof typeof AUTH_TOKENS];
