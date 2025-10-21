/**
 * Storage provider configuration options
 */
export interface StorageConfig {
    provider: 's3' | 'minio';
    endpoint?: string;
    region?: string;
    bucket: string;
    credentials: {
        accessKeyId: string;
        secretAccessKey: string;
    };
    forcePathStyle?: boolean;
}

/**
 * Upload options for file storage
 */
export interface UploadOptions {
    bucket?: string;
    path?: string;
    acl?: 'private' | 'public-read' | 'public-read-write';
    contentType?: string;
    metadata?: Record<string, string>;
    cacheControl?: string;
}

/**
 * Result of a file upload operation
 */
export interface UploadResult {
    key: string;
    url: string;
    bucket: string;
    size: number;
    contentType: string;
    etag?: string;
}

/**
 * File validation configuration
 */
export interface FileValidationConfig {
    maxFileSize?: number; // in bytes
    maxFiles?: number;
    allowedMimeTypes?: string[];
    allowedExtensions?: string[];
    minFileSize?: number;
}

/**
 * File validation result
 */
export interface FileValidationResult {
    valid: boolean;
    errors: string[];
}

