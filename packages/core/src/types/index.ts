import { Request, Response, NextFunction } from 'express';

export interface AppConfig {
    port: number;
    env: string;
    cors?: {
        origin: string | string[];
        credentials?: boolean;
    };
}

export interface MiddlewareFunction {
    (req: Request, res: Response, next: NextFunction): void | Promise<void>;
}

export interface RouteHandler {
    (req: Request, res: Response, next: NextFunction): void | Promise<void>;
}

export interface ErrorResponse {
    message: string;
    statusCode: number;
    stack?: string;
}

export * from './validation';
export * from './controller';
