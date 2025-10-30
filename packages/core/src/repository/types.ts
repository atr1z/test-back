/**
 * Query filters for repository operations
 */
export interface QueryFilters {
    where?: Record<string, any>;
    orderBy?: { field: string; direction: 'ASC' | 'DESC' }[];
    limit?: number;
    offset?: number;
    select?: string[];
}

/**
 * Pagination options
 */
export interface PaginationOptions {
    page: number;
    perPage: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Repository configuration
 */
export interface RepositoryConfig {
    tableName: string;
    primaryKey?: string;
    softDelete?: boolean;
    softDeleteField?: string;
    timestamps?: {
        createdAt?: string;
        updatedAt?: string;
    };
    cache?: {
        enabled: boolean;
        ttl: number;
    };
}

/**
 * Source priority levels
 */
export enum SourcePriority {
    PRIMARY = 1,
    SECONDARY = 2,
    FALLBACK = 3,
}

/**
 * Source metadata
 */
export interface SourceMetadata {
    name: string;
    priority: SourcePriority;
    type: 'database' | 'cache' | 'api' | 'custom';
    healthy: boolean;
}

/**
 * Source capabilities
 */
export interface SourceCapabilities {
    read: boolean;
    write: boolean;
    delete: boolean;
    transaction: boolean;
}

/**
 * Data source interface
 */
export interface DataSource<T> {
    getMetadata(): SourceMetadata;
    getCapabilities(): SourceCapabilities;
    supports(operation: string): boolean;
    isHealthy(): Promise<boolean>;

    findById(id: string | number): Promise<T | null>;
    findOne(filters: QueryFilters): Promise<T | null>;
    findAll(filters?: QueryFilters): Promise<T[]>;
    findPaginated(
        filters: QueryFilters,
        pagination: PaginationOptions
    ): Promise<PaginatedResult<T>>;
    create(data: Partial<T>): Promise<T>;
    update(id: string | number, data: Partial<T>): Promise<T | null>;
    delete(id: string | number): Promise<boolean>;
    count(filters?: QueryFilters): Promise<number>;
    exists(id: string | number): Promise<boolean>;

    // Optional advanced features
    raw?(query: string, params?: any[]): Promise<any>;
    beginTransaction?(): Promise<void>;
    commitTransaction?(): Promise<void>;
    rollbackTransaction?(): Promise<void>;

    // Optional batch operations
    createMany?(data: Partial<T>[]): Promise<T[]>;
    updateMany?(filters: QueryFilters, data: Partial<T>): Promise<number>;
    deleteMany?(filters: QueryFilters): Promise<number>;

    // Optional cache operations
    invalidateAll?(): Promise<void>;
}
