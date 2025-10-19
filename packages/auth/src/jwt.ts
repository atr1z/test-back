import jwt from 'jsonwebtoken';
import { JWTPayload, TokenOptions } from './types';

export class JWTService {
    private secret: string;
    private defaultExpiresIn: string | number;

    constructor(secret: string, defaultExpiresIn: string | number = '7d') {
        if (!secret) {
            throw new Error('JWT secret is required');
        }
        this.secret = secret;
        this.defaultExpiresIn = defaultExpiresIn;
    }

    /**
     * Generate a JWT token
     */
    generateToken(payload: JWTPayload, options?: TokenOptions): string {
        return jwt.sign(payload, this.secret, {
            expiresIn: (options?.expiresIn ||
                this.defaultExpiresIn) as jwt.SignOptions['expiresIn'],
        });
    }

    /**
     * Verify and decode a JWT token
     */
    verifyToken(token: string): JWTPayload {
        try {
            return jwt.verify(token, this.secret) as JWTPayload;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Token has expired');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Invalid token');
            }
            throw error;
        }
    }

    /**
     * Decode a token without verification (useful for debugging)
     */
    decodeToken(token: string): JWTPayload | null {
        return jwt.decode(token) as JWTPayload | null;
    }
}
