import type { Redis } from 'ioredis';
import { BaseDataSource } from '../data-source.js';
import {
    QueryFilters,
    PaginationOptions,
    PaginatedResult,
    RepositoryConfig,
    SourceMetadata,
    SourceCapabilities,
    SourcePriority,
} from '../types.js';

/**
 * Redis cache data source
 * Secondary source for fast reads
 */
export class CacheSource<T> extends BaseDataSource<T> {
    private config: RepositoryConfig;
    private keyPrefix: string;

    constructor(
        private redis: Redis,
        config: Partial<RepositoryConfig>
    ) {
        super();
        this.config = {
            tableName: config.tableName || '',
            primaryKey: config.primaryKey || 'id',
            cache: config.cache || { enabled: true, ttl: 300 },
            ...config,
        };
        this.keyPrefix = `cache:${this.config.tableName}:`;
    }

    getMetadata(): SourceMetadata {
        return {
            name: 'cache',
            priority: SourcePriority.SECONDARY,
            type: 'cache',
            healthy: true,
        };
    }

    getCapabilities(): SourceCapabilities {
        return {
            read: true,
            write: true,
            delete: true,
            transaction: false,
        };
    }

    async isHealthy(): Promise<boolean> {
        try {
            await this.redis.ping();
            return true;
        } catch {
            return false;
        }
    }

    async findById(id: string | number): Promise<T | null> {
        const key = this.buildKey(id);
        const data = await this.redis.get(key);

        if (!data) {
            return null;
        }

        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    async findOne(_filters: QueryFilters): Promise<T | null> {
        // Cache doesn't support complex queries, return null to fallback to DB
        return null;
    }

    async findAll(_filters?: QueryFilters): Promise<T[]> {
        // Cache doesn't support complex queries, return empty array to fallback to DB
        return [];
    }

    async findPaginated(
        _filters: QueryFilters,
        pagination: PaginationOptions
    ): Promise<PaginatedResult<T>> {
        // Cache doesn't support pagination, return empty result to fallback to DB
        return {
            data: [],
            pagination: {
                page: pagination.page,
                perPage: pagination.perPage,
                total: 0,
                totalPages: 0,
            },
        };
    }

    async create(data: Partial<T>): Promise<T> {
        const id = (data as any)[this.config.primaryKey!];
        if (!id) {
            throw new Error('Primary key is required for cache operations');
        }

        const key = this.buildKey(id);
        const serialized = JSON.stringify(data);

        await this.redis.setex(key, this.config.cache!.ttl, serialized);

        return data as T;
    }

    async update(id: string | number, data: Partial<T>): Promise<T | null> {
        const key = this.buildKey(id);
        const existing = await this.redis.get(key);

        if (!existing) {
            return null;
        }

        const updated = { ...JSON.parse(existing), ...data };
        const serialized = JSON.stringify(updated);

        await this.redis.setex(key, this.config.cache!.ttl, serialized);

        return updated;
    }

    async delete(id: string | number): Promise<boolean> {
        const key = this.buildKey(id);
        const result = await this.redis.del(key);
        return result > 0;
    }

    async count(_filters?: QueryFilters): Promise<number> {
        // Cache doesn't support counting, return 0 to fallback to DB
        return 0;
    }

    async exists(id: string | number): Promise<boolean> {
        const key = this.buildKey(id);
        const result = await this.redis.exists(key);
        return result === 1;
    }

    /**
     * Invalidate all cache entries for this table
     */
    async invalidateAll(): Promise<void> {
        const pattern = `${this.keyPrefix}*`;
        const keys = await this.redis.keys(pattern);

        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
    }

    /**
     * Set cache entry with custom TTL
     */
    async set(id: string | number, data: T, ttl?: number): Promise<void> {
        const key = this.buildKey(id);
        const serialized = JSON.stringify(data);
        const cacheTtl = ttl || this.config.cache!.ttl;

        await this.redis.setex(key, cacheTtl, serialized);
    }

    /**
     * Get cache entry
     */
    async get(id: string | number): Promise<T | null> {
        return this.findById(id);
    }

    private buildKey(id: string | number): string {
        return `${this.keyPrefix}${id}`;
    }
}
