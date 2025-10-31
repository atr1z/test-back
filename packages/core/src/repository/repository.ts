import { DataSource } from './types.js';
import {
    QueryFilters,
    PaginationOptions,
    PaginatedResult,
    RepositoryConfig,
} from './types.js';

/**
 * Base Repository class with multi-source data access
 * Similar pattern to BaseController but for data operations
 *
 * @example
 * ```typescript
 * @injectable()
 * export class UserRepository extends BaseRepository<User> {
 *   constructor(
 *     @inject(DB_TOKENS.Database) db: DatabasePool,
 *     @inject(CACHE_TOKENS.Redis) cache?: Redis
 *   ) {
 *     const dbSource = new DatabaseSource(db, 'users');
 *     const cacheSource = cache ? new CacheSource(cache, 'users') : undefined;
 *
 *     super(dbSource, cacheSource ? [cacheSource] : []);
 *   }
 *
 *   protected getConfig(): RepositoryConfig {
 *     return {
 *       tableName: 'users',
 *       primaryKey: 'id',
 *       softDelete: true,
 *       timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
 *       cache: { enabled: true, ttl: 300 }
 *     };
 *   }
 * }
 * ```
 */
export abstract class BaseRepository<T> {
    protected sources: DataSource<T>[] = [];

    constructor(
        protected primarySource: DataSource<T>,
        protected fallbackSources: DataSource<T>[] = []
    ) {
        // Primary source always comes first
        this.sources = [primarySource, ...fallbackSources];

        // Sort sources by priority
        this.sources.sort((a, b) => {
            const aMeta = a.getMetadata();
            const bMeta = b.getMetadata();
            return aMeta.priority - bMeta.priority;
        });
    }

    /**
     * Get repository configuration
     * Override this in child classes
     */
    protected abstract getConfig(): RepositoryConfig;

    /**
     * Transform database row to domain entity
     * Override this for custom transformations
     */
    protected toDomain(row: any): T {
        return row as T;
    }

    /**
     * Transform domain entity to database row
     * Override this for custom transformations
     */
    protected toDatabase(entity: Partial<T>): any {
        return entity;
    }

    /**
     * Find a record by ID
     * Tries sources in priority order with fallback
     */
    async findById(id: string | number): Promise<T | null> {
        for (const source of this.sources) {
            try {
                if (!source.supports('findById')) continue;

                const healthy = await source.isHealthy();
                if (!healthy) continue;

                const result = await source.findById(id);
                if (result) {
                    // Sync to higher priority sources if found in fallback
                    await this.syncToHigherPrioritySources(id, result, source);
                    return this.toDomain(result);
                }
            } catch (error) {
                console.error(
                    `Error in source ${source.getMetadata().name}:`,
                    error
                );
                continue; // Try next source
            }
        }

        return null;
    }

    /**
     * Find a single record matching filters
     */
    async findOne(filters: QueryFilters): Promise<T | null> {
        for (const source of this.sources) {
            try {
                if (!source.supports('findOne')) continue;

                const healthy = await source.isHealthy();
                if (!healthy) continue;

                const result = await source.findOne(filters);
                if (result) {
                    return this.toDomain(result);
                }
            } catch (error) {
                console.error(
                    `Error in source ${source.getMetadata().name}:`,
                    error
                );
                continue;
            }
        }

        return null;
    }

    /**
     * Find all records matching filters
     */
    async findAll(filters?: QueryFilters): Promise<T[]> {
        // For read operations, prefer cache/faster sources
        const readSources = this.sources.filter(s => s.supports('findAll'));

        for (const source of readSources) {
            try {
                const healthy = await source.isHealthy();
                if (!healthy) continue;

                const results = await source.findAll(filters);
                return results.map((r: any) => this.toDomain(r));
            } catch (error) {
                console.error(
                    `Error in source ${source.getMetadata().name}:`,
                    error
                );
                continue;
            }
        }

        return [];
    }

    /**
     * Find records with pagination
     */
    async findPaginated(
        filters: QueryFilters,
        pagination: PaginationOptions
    ): Promise<PaginatedResult<T>> {
        const source = this.sources.find(s => s.supports('findAll'));

        if (!source) {
            throw new Error('No source available for findPaginated operation');
        }

        const result = await source.findPaginated(filters, pagination);

        return {
            ...result,
            data: result.data.map((r: any) => this.toDomain(r)),
        };
    }

    /**
     * Create a new record
     * Always uses primary source (write operation)
     */
    async create(data: Partial<T>): Promise<T> {
        if (!this.primarySource.supports('create')) {
            throw new Error('Primary source does not support create operation');
        }

        const dbData = this.toDatabase(data);
        const result = await this.primarySource.create(dbData);

        // Invalidate cache in other sources
        await this.invalidateCache();

        return this.toDomain(result);
    }

    /**
     * Create multiple records
     */
    async createMany(data: Partial<T>[]): Promise<T[]> {
        const dbData = data.map(d => this.toDatabase(d));
        const results = (await this.primarySource.createMany?.(dbData)) || [];

        await this.invalidateCache();

        return results.map((r: any) => this.toDomain(r));
    }

    /**
     * Update a record by ID
     * Always uses primary source (write operation)
     */
    async update(id: string | number, data: Partial<T>): Promise<T | null> {
        if (!this.primarySource.supports('update')) {
            throw new Error('Primary source does not support update operation');
        }

        const dbData = this.toDatabase(data);
        const result = await this.primarySource.update(id, dbData);

        // Invalidate cache
        await this.invalidateCacheForId(id);

        return result ? this.toDomain(result) : null;
    }

    /**
     * Update multiple records
     */
    async updateMany(filters: QueryFilters, data: Partial<T>): Promise<number> {
        const dbData = this.toDatabase(data);
        const count =
            (await this.primarySource.updateMany?.(filters, dbData)) || 0;

        await this.invalidateCache();

        return count;
    }

    /**
     * Delete a record by ID
     * Supports soft delete if configured
     */
    async delete(id: string | number): Promise<boolean> {
        const config = this.getConfig();

        if (config.softDelete && config.softDeleteField) {
            // Soft delete - update the deleted_at field
            const softDeleteData = {
                [config.softDeleteField]: new Date(),
            } as Partial<T>;

            const result = await this.update(id, softDeleteData);
            return result !== null;
        }

        // Hard delete
        if (!this.primarySource.supports('delete')) {
            throw new Error('Primary source does not support delete operation');
        }

        const result = await this.primarySource.delete(id);

        await this.invalidateCacheForId(id);

        return result;
    }

    /**
     * Delete multiple records
     */
    async deleteMany(filters: QueryFilters): Promise<number> {
        const count = (await this.primarySource.deleteMany?.(filters)) || 0;

        await this.invalidateCache();

        return count;
    }

    /**
     * Count records matching filters
     */
    async count(filters?: QueryFilters): Promise<number> {
        const source = this.sources.find(s => s.supports('count'));

        if (!source) {
            throw new Error('No source available for count operation');
        }

        return source.count(filters);
    }

    /**
     * Check if a record exists
     */
    async exists(id: string | number): Promise<boolean> {
        const source = this.sources.find(s => s.supports('exists'));

        if (!source) {
            throw new Error('No source available for exists operation');
        }

        return source.exists(id);
    }

    /**
     * Execute raw query (if primary source supports it)
     */
    async raw(query: string, params?: any[]): Promise<any> {
        if (!this.primarySource.raw) {
            throw new Error('Primary source does not support raw queries');
        }

        return this.primarySource.raw(query, params);
    }

    /**
     * Begin a transaction (if primary source supports it)
     */
    async beginTransaction(): Promise<void> {
        if (!this.primarySource.beginTransaction) {
            throw new Error('Primary source does not support transactions');
        }

        return this.primarySource.beginTransaction();
    }

    /**
     * Commit a transaction
     */
    async commitTransaction(): Promise<void> {
        if (!this.primarySource.commitTransaction) {
            throw new Error('Primary source does not support transactions');
        }

        return this.primarySource.commitTransaction();
    }

    /**
     * Rollback a transaction
     */
    async rollbackTransaction(): Promise<void> {
        if (!this.primarySource.rollbackTransaction) {
            throw new Error('Primary source does not support transactions');
        }

        return this.primarySource.rollbackTransaction();
    }

    /**
     * Execute a function within a transaction
     */
    async withTransaction<TResult>(
        callback: (repo: this) => Promise<TResult>
    ): Promise<TResult> {
        try {
            await this.beginTransaction();
            const result = await callback(this);
            await this.commitTransaction();
            return result;
        } catch (error) {
            await this.rollbackTransaction();
            throw error;
        }
    }

    /**
     * Sync data to higher priority sources
     * (e.g., if found in DB but not in cache, populate cache)
     */
    protected async syncToHigherPrioritySources(
        id: string | number,
        data: T,
        currentSource: DataSource<T>
    ): Promise<void> {
        const currentPriority = currentSource.getMetadata().priority;

        for (const source of this.sources) {
            const sourcePriority = source.getMetadata().priority;

            // Only sync to higher priority (lower number) sources
            if (sourcePriority >= currentPriority) continue;

            try {
                if (source.supports('update')) {
                    await source.update(id, data as Partial<T>);
                } else if (source.supports('create')) {
                    await source.create(data as Partial<T>);
                }
            } catch (error) {
                console.error(
                    `Failed to sync to ${source.getMetadata().name}:`,
                    error
                );
            }
        }
    }

    /**
     * Invalidate cache for a specific ID
     */
    protected async invalidateCacheForId(id: string | number): Promise<void> {
        const cacheSources = this.sources.filter(
            s => s.getMetadata().type === 'cache'
        );

        for (const cache of cacheSources) {
            try {
                await cache.delete(id);
            } catch (error) {
                console.error(
                    `Failed to invalidate cache for ID ${id}:`,
                    error
                );
            }
        }
    }

    /**
     * Invalidate all cache
     */
    protected async invalidateCache(): Promise<void> {
        const cacheSources = this.sources.filter(
            s => s.getMetadata().type === 'cache'
        );

        for (const cache of cacheSources) {
            try {
                if (cache.invalidateAll) {
                    await cache.invalidateAll();
                }
            } catch (error) {
                console.error(`Failed to invalidate cache:`, error);
            }
        }
    }

    /**
     * Get all data sources
     */
    getSources(): DataSource<T>[] {
        return this.sources;
    }

    /**
     * Get primary data source
     */
    getPrimarySource(): DataSource<T> {
        return this.primarySource;
    }

    /**
     * Get source health status
     */
    async getHealthStatus(): Promise<Record<string, boolean>> {
        const status: Record<string, boolean> = {};

        for (const source of this.sources) {
            const metadata = source.getMetadata();
            status[metadata.name] = await source.isHealthy();
        }

        return status;
    }
}
