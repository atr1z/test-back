import { Request } from 'express';

/**
 * Extended Express request with file upload
 */
export interface UploadRequest extends Request {
    file?: Express.Multer.File;
    files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

/**
 * Upload middleware configuration
 */
export interface UploadMiddlewareConfig {
    maxFileSize?: number;
    maxFiles?: number;
    allowedMimeTypes?: string[];
    allowedExtensions?: string[];
    destination?: string;
}

/**
 * Multer field configuration
 */
export interface UploadField {
    name: string;
    maxCount?: number;
}

