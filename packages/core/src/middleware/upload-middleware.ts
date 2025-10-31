import multer from 'multer';
import { Request, RequestHandler } from 'express';
import { UploadMiddlewareConfig, UploadField } from '../types/index.js';

/**
 * Create upload middleware with configuration
 */
export function createUploadMiddleware(config: UploadMiddlewareConfig = {}) {
    // Use memory storage to keep files in memory for cloud upload
    const storage = multer.memoryStorage();

    const fileFilter = (
        _req: Request,
        file: Express.Multer.File,
        callback: multer.FileFilterCallback
    ) => {
        // Check MIME type
        if (config.allowedMimeTypes?.length) {
            if (!config.allowedMimeTypes.includes(file.mimetype)) {
                return callback(
                    new Error(`File type ${file.mimetype} not allowed`)
                );
            }
        }

        // Check extension
        if (config.allowedExtensions?.length) {
            const ext = file.originalname.split('.').pop()?.toLowerCase();
            if (!ext || !config.allowedExtensions.includes(ext)) {
                return callback(
                    new Error(`File extension .${ext} not allowed`)
                );
            }
        }

        callback(null, true);
    };

    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: config.maxFileSize || 5 * 1024 * 1024, // 5MB default
            files: config.maxFiles || 10,
        },
    });
}

/**
 * Upload a single file
 */
export function uploadSingle(
    fieldName: string,
    config?: UploadMiddlewareConfig
): RequestHandler {
    return createUploadMiddleware(config).single(fieldName);
}

/**
 * Upload multiple files from a single field
 */
export function uploadMultiple(
    fieldName: string,
    maxCount: number,
    config?: UploadMiddlewareConfig
): RequestHandler {
    return createUploadMiddleware(config).array(fieldName, maxCount);
}

/**
 * Upload files from multiple fields
 */
export function uploadFields(
    fields: UploadField[],
    config?: UploadMiddlewareConfig
): RequestHandler {
    return createUploadMiddleware(config).fields(fields);
}

/**
 * Accept any files
 */
export function uploadAny(config?: UploadMiddlewareConfig): RequestHandler {
    return createUploadMiddleware(config).any();
}
