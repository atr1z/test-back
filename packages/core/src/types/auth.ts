import { Request } from 'express';
import { SignOptions } from 'jsonwebtoken';

export interface JWTPayload {
    userId: string;
    email?: string;
    [key: string]: any;
}

export interface AuthRequest extends Request {
    user?: JWTPayload;
}

export interface TokenOptions extends Pick<SignOptions, 'expiresIn'> {}
