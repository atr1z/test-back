import { UploadOptions, UploadResult } from '../types';

/**
 * Storage provider interface
 * All storage providers must implement this interface
 */
export interface StorageProvider {
    /**
     * Upload a single file to storage
     */
    upload(file: Express.Multer.File, options?: UploadOptions): Promise<UploadResult>;

    /**
     * Upload multiple files to storage
     */
    uploadMultiple(files: Express.Multer.File[], options?: UploadOptions): Promise<UploadResult[]>;

    /**
     * Delete a file from storage
     */
    delete(fileKey: string, bucket?: string): Promise<boolean>;

    /**
     * Delete multiple files from storage
     */
    deleteMultiple(fileKeys: string[], bucket?: string): Promise<boolean[]>;

    /**
     * Get a signed URL for private file access
     */
    getSignedUrl(fileKey: string, expiresIn?: number, bucket?: string): Promise<string>;

    /**
     * Get public URL for a file
     */
    getPublicUrl(fileKey: string, bucket?: string): string;

    /**
     * Check if a file exists in storage
     */
    exists(fileKey: string, bucket?: string): Promise<boolean>;

    /**
     * Get file metadata
     */
    getMetadata(fileKey: string, bucket?: string): Promise<Record<string, any>>;
}

