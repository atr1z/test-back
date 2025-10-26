import { registerInstance, registerSingleton, getEnv } from '@atriz/core';
import {
    StorageService,
    S3Provider,
    MinioProvider,
    StorageProvider,
    STORAGE_TOKENS,
} from '@atriz/storage';

/**
 * Setup storage provider based on environment configuration
 */
export function setupStorage(): void {
    const provider = getEnv('STORAGE_PROVIDER', 'minio');

    let storageProvider: StorageProvider;

    if (provider === 's3') {
        // Digital Ocean Spaces (S3-compatible)
        storageProvider = new S3Provider({
            provider: 's3',
            endpoint: getEnv('DO_SPACES_ENDPOINT'),
            region: getEnv('DO_SPACES_REGION'),
            bucket: getEnv('DO_SPACES_BUCKET'),
            credentials: {
                accessKeyId: getEnv('DO_SPACES_KEY'),
                secretAccessKey: getEnv('DO_SPACES_SECRET'),
            },
        });
    } else {
        // Minio (local development)
        storageProvider = new MinioProvider({
            provider: 'minio',
            endpoint: getEnv('MINIO_ENDPOINT', 'http://localhost:9000'),
            bucket: getEnv('MINIO_BUCKET', 'pshop-uploads'),
            credentials: {
                accessKeyId: getEnv('MINIO_ACCESS_KEY', 'minioadmin'),
                secretAccessKey: getEnv('MINIO_SECRET_KEY', 'minioadmin'),
            },
        });
    }

    // Register storage provider and service in DI container
    registerInstance(STORAGE_TOKENS.Provider, storageProvider);
    registerSingleton(STORAGE_TOKENS.StorageService, StorageService);

    console.log(`✅ Storage provider configured: ${provider}`);
}
