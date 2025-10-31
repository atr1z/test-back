import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    HeadObjectCommand,
    GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { lookup } from 'mime-types';
import { StorageProvider } from './storage-provider.js';
import { StorageConfig, UploadOptions, UploadResult } from '../types/index.js';

/**
 * S3-compatible storage provider
 * Works with AWS S3, Digital Ocean Spaces, and other S3-compatible services
 */
export class S3Provider implements StorageProvider {
    private client: S3Client;
    private config: StorageConfig;

    constructor(config: StorageConfig) {
        this.config = config;
        const clientConfig: any = {
            region: config.region || 'us-east-1',
            credentials: config.credentials,
            forcePathStyle: config.forcePathStyle ?? true,
        };

        if (config.endpoint) {
            clientConfig.endpoint = config.endpoint;
        }

        this.client = new S3Client(clientConfig);
    }

    /**
     * Upload a file to S3
     */
    async upload(
        file: Express.Multer.File,
        options: UploadOptions = {}
    ): Promise<UploadResult> {
        const bucket = options.bucket || this.config.bucket;
        const key = this.generateKey(file.originalname, options.path);
        const contentType =
            options.contentType ||
            file.mimetype ||
            lookup(file.originalname) ||
            'application/octet-stream';

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: file.buffer,
            ContentType: contentType,
            ACL: options.acl || 'private',
            Metadata: options.metadata,
            CacheControl: options.cacheControl,
        });

        const response = await this.client.send(command);

        return {
            key,
            url: this.getPublicUrl(key, bucket),
            bucket,
            size: file.size,
            contentType,
            etag: response.ETag || undefined,
        };
    }

    /**
     * Upload multiple files to S3
     */
    async uploadMultiple(
        files: Express.Multer.File[],
        options: UploadOptions = {}
    ): Promise<UploadResult[]> {
        const uploadPromises = files.map(file => this.upload(file, options));
        return Promise.all(uploadPromises);
    }

    /**
     * Delete a file from S3
     */
    async delete(fileKey: string, bucket?: string): Promise<boolean> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: bucket || this.config.bucket,
                Key: fileKey,
            });

            await this.client.send(command);
            return true;
        } catch (error) {
            console.error('Error deleting file from S3:', error);
            return false;
        }
    }

    /**
     * Delete multiple files from S3
     */
    async deleteMultiple(
        fileKeys: string[],
        bucket?: string
    ): Promise<boolean[]> {
        try {
            const command = new DeleteObjectsCommand({
                Bucket: bucket || this.config.bucket,
                Delete: {
                    Objects: fileKeys.map(key => ({ Key: key })),
                },
            });

            const response = await this.client.send(command);

            // Map results - check if each key was successfully deleted
            return fileKeys.map(key => {
                return !response.Errors?.some(error => error.Key === key);
            });
        } catch (error) {
            console.error('Error deleting multiple files from S3:', error);
            return fileKeys.map(() => false);
        }
    }

    /**
     * Generate a signed URL for private file access
     */
    async getSignedUrl(
        fileKey: string,
        expiresIn = 3600,
        bucket?: string
    ): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: bucket || this.config.bucket,
            Key: fileKey,
        });

        return getSignedUrl(this.client, command, { expiresIn });
    }

    /**
     * Get public URL for a file
     */
    getPublicUrl(fileKey: string, bucket?: string): string {
        const bucketName = bucket || this.config.bucket;

        if (this.config.endpoint) {
            // For custom endpoints like Digital Ocean Spaces
            return `${this.config.endpoint}/${bucketName}/${fileKey}`;
        }

        // For standard AWS S3
        return `https://${bucketName}.s3.${this.config.region}.amazonaws.com/${fileKey}`;
    }

    /**
     * Check if a file exists in S3
     */
    async exists(fileKey: string, bucket?: string): Promise<boolean> {
        try {
            const command = new HeadObjectCommand({
                Bucket: bucket || this.config.bucket,
                Key: fileKey,
            });

            await this.client.send(command);
            return true;
        } catch (error: any) {
            if (error.name === 'NotFound') {
                return false;
            }
            throw error;
        }
    }

    /**
     * Get file metadata
     */
    async getMetadata(
        fileKey: string,
        bucket?: string
    ): Promise<Record<string, any>> {
        const command = new HeadObjectCommand({
            Bucket: bucket || this.config.bucket,
            Key: fileKey,
        });

        const response = await this.client.send(command);

        return {
            contentType: response.ContentType,
            contentLength: response.ContentLength,
            lastModified: response.LastModified,
            etag: response.ETag,
            metadata: response.Metadata,
        };
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
