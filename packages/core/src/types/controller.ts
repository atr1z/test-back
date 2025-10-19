import { Request, Response } from 'express';

export interface ControllerRequest extends Request {
    user?: {
        userId: string;
        email?: string;
        [key: string]: any;
    };
}

export interface ResponseData<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
    meta?: {
        timestamp: string;
        path: string;
        [key: string]: any;
    };
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
