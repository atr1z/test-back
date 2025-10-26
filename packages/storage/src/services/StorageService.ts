import { injectable, inject } from 'tsyringe';
import { StorageProvider } from '../providers';
import { UploadOptions, UploadResult } from '../types';
import { STORAGE_TOKENS } from '../di/tokens';

/**
 * Main storage service
 * Abstracts the underlying storage provider
 */
@injectable()
export class StorageService {
    constructor(@inject(STORAGE_TOKENS.Provider) private provider: StorageProvider) {}

    /**
     * Upload a single file
     */
    async uploadFile(file: Express.Multer.File, options?: UploadOptions): Promise<UploadResult> {
        return this.provider.upload(file, options);
    }

    /**
     * Upload multiple files
     */
    async uploadFiles(
        files: Express.Multer.File[],
        options?: UploadOptions
    ): Promise<UploadResult[]> {
        return this.provider.uploadMultiple(files, options);
    }

    /**
     * Delete a file
     */
    async deleteFile(fileKey: string, bucket?: string): Promise<boolean> {
        return this.provider.delete(fileKey, bucket);
    }

    /**
     * Delete multiple files
     */
    async deleteFiles(fileKeys: string[], bucket?: string): Promise<boolean[]> {
        return this.provider.deleteMultiple(fileKeys, bucket);
    }

    /**
     * Get a signed URL for temporary access to a private file
     */
    async getSignedUrl(fileKey: string, expiresIn = 3600, bucket?: string): Promise<string> {
        return this.provider.getSignedUrl(fileKey, expiresIn, bucket);
    }

    /**
     * Get public URL for a file
     */
    getPublicUrl(fileKey: string, bucket?: string): string {
        return this.provider.getPublicUrl(fileKey, bucket);
    }

    /**
     * Check if a file exists
     */
    async fileExists(fileKey: string, bucket?: string): Promise<boolean> {
        return this.provider.exists(fileKey, bucket);
    }

    /**
     * Get file metadata
     */
    async getFileMetadata(fileKey: string, bucket?: string): Promise<Record<string, any>> {
        return this.provider.getMetadata(fileKey, bucket);
    }
}
