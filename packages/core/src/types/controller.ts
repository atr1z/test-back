import { Request, Response, NextFunction } from 'express';
import { CorsOptions } from 'cors';

export interface ControllerRequest extends Request {
    user?: {
        userId: string;
        email?: string;
        [key: string]: any;
    };
}

export interface ResponseData<T = any> {
    success: boolean;
    data?: T | undefined;
    message?: string | undefined;
    errors?: string[] | undefined;
    meta?:
        | {
              timestamp: string;
              path: string;
              [key: string]: any;
          }
        | undefined;
}

export enum HttpStatus {
    OK = 200,
    Created = 201,
    NoContent = 204,
    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    Conflict = 409,
    UnprocessableEntity = 422,
    InternalServerError = 500,
}

export interface AppConfig {
    port: number;
    env: string;
    cors?: CorsOptions;
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
    stack?: string | undefined;
}
