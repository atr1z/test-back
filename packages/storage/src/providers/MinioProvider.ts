import { Client as MinioClient, BucketItem } from 'minio';
import { lookup } from 'mime-types';
import { StorageProvider } from './StorageProvider';
import { StorageConfig, UploadOptions, UploadResult } from '../types';

/**
 * Minio storage provider
 * For local development and self-hosted S3-compatible storage
 */
export class MinioProvider implements StorageProvider {
    private client: MinioClient;
    private config: StorageConfig;

    constructor(config: StorageConfig) {
        this.config = config;

        // Parse endpoint to get host and port
        const url = new URL(config.endpoint || 'http://localhost:9000');

        this.client = new MinioClient({
            endPoint: url.hostname,
            port: url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 9000),
            useSSL: url.protocol === 'https:',
            accessKey: config.credentials.accessKeyId,
            secretKey: config.credentials.secretAccessKey,
            region: config.region,
        });
    }

    /**
     * Upload a file to Minio
     */
    async upload(file: Express.Multer.File, options: UploadOptions = {}): Promise<UploadResult> {
        const bucket = options.bucket || this.config.bucket;
        const key = this.generateKey(file.originalname, options.path);
        const contentType = options.contentType || file.mimetype || lookup(file.originalname) || 'application/octet-stream';

        // Ensure bucket exists
        await this.ensureBucket(bucket);

        // Upload metadata
        const metaData: Record<string, string> = {
            'Content-Type': contentType,
            ...options.metadata,
        };

        if (options.cacheControl) {
            metaData['Cache-Control'] = options.cacheControl;
        }

        await this.client.putObject(bucket, key, file.buffer, file.size, metaData);

        return {
            key,
            url: this.getPublicUrl(key, bucket),
            bucket,
            size: file.size,
            contentType,
        };
    }

    /**
     * Upload multiple files to Minio
     */
    async uploadMultiple(
        files: Express.Multer.File[],
        options: UploadOptions = {}
    ): Promise<UploadResult[]> {
        const uploadPromises = files.map((file) => this.upload(file, options));
        return Promise.all(uploadPromises);
    }

    /**
     * Delete a file from Minio
     */
    async delete(fileKey: string, bucket?: string): Promise<boolean> {
        try {
            await this.client.removeObject(bucket || this.config.bucket, fileKey);
            return true;
        } catch (error) {
            console.error('Error deleting file from Minio:', error);
            return false;
        }
    }

    /**
     * Delete multiple files from Minio
     */
    async deleteMultiple(fileKeys: string[], bucket?: string): Promise<boolean[]> {
        const bucketName = bucket || this.config.bucket;
        const results: boolean[] = [];

        for (const key of fileKeys) {
            const success = await this.delete(key, bucketName);
            results.push(success);
        }

        return results;
    }

    /**
     * Generate a signed URL for private file access
     */
    async getSignedUrl(fileKey: string, expiresIn = 3600, bucket?: string): Promise<string> {
        return this.client.presignedGetObject(bucket || this.config.bucket, fileKey, expiresIn);
    }

    /**
     * Get public URL for a file
     */
    getPublicUrl(fileKey: string, bucket?: string): string {
        const bucketName = bucket || this.config.bucket;
        const endpoint = this.config.endpoint || 'http://localhost:9000';
        return `${endpoint}/${bucketName}/${fileKey}`;
    }

    /**
     * Check if a file exists in Minio
     */
    async exists(fileKey: string, bucket?: string): Promise<boolean> {
        try {
            await this.client.statObject(bucket || this.config.bucket, fileKey);
            return true;
        } catch (error: any) {
            if (error.code === 'NotFound') {
                return false;
            }
            throw error;
        }
    }

    /**
     * Get file metadata
     */
    async getMetadata(fileKey: string, bucket?: string): Promise<Record<string, any>> {
        const stat = await this.client.statObject(bucket || this.config.bucket, fileKey);

        return {
            contentType: stat.metaData['content-type'],
            contentLength: stat.size,
            lastModified: stat.lastModified,
            etag: stat.etag,
            metadata: stat.metaData,
        };
    }

    /**
     * Ensure bucket exists, create if not
     */
    private async ensureBucket(bucket: string): Promise<void> {
        const exists = await this.client.bucketExists(bucket);
        if (!exists) {
            await this.client.makeBucket(bucket, this.config.region || 'us-east-1');
        }
    }

    /**
     * Generate a unique key for the file
     */
    private generateKey(originalName: string, path?: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const ext = originalName.split('.').pop();
        const basePath = path ? `${path}/` : '';

        return `${basePath}${timestamp}-${random}.${ext}`;
    }
}

