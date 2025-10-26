/**
 * Dependency injection tokens for storage services
 */
export const STORAGE_TOKENS = {
    Provider: Symbol.for('StorageProvider'),
    StorageService: Symbol.for('StorageService'),
} as const;
