import {
    DataSource,
    SourceMetadata,
    SourceCapabilities,
    QueryFilters,
    PaginationOptions,
    PaginatedResult,
} from './types';

/**
 * Base data source implementation
 * Provides common functionality for all data sources
 */
export abstract class BaseDataSource<T> implements DataSource<T> {
    abstract getMetadata(): SourceMetadata;
    abstract getCapabilities(): SourceCapabilities;

    supports(operation: string): boolean {
        const capabilities = this.getCapabilities();

        switch (operation) {
            case 'findById':
            case 'findOne':
            case 'findAll':
            case 'findPaginated':
            case 'count':
            case 'exists':
                return capabilities.read;
            case 'create':
            case 'update':
            case 'delete':
                return capabilities.write;
            case 'raw':
            case 'beginTransaction':
            case 'commitTransaction':
            case 'rollbackTransaction':
                return capabilities.transaction;
            default:
                return false;
        }
    }

    abstract isHealthy(): Promise<boolean>;
    abstract findById(id: string | number): Promise<T | null>;
    abstract findOne(filters: QueryFilters): Promise<T | null>;
    abstract findAll(filters?: QueryFilters): Promise<T[]>;
    abstract findPaginated(
        filters: QueryFilters,
        pagination: PaginationOptions
    ): Promise<PaginatedResult<T>>;
    abstract create(data: Partial<T>): Promise<T>;
    abstract update(id: string | number, data: Partial<T>): Promise<T | null>;
    abstract delete(id: string | number): Promise<boolean>;
    abstract count(filters?: QueryFilters): Promise<number>;
    abstract exists(id: string | number): Promise<boolean>;

    // Optional methods - override in subclasses
    raw?(_query: string, _params?: any[]): Promise<any> {
        throw new Error('Raw queries not supported by this data source');
    }

    beginTransaction?(): Promise<void> {
        throw new Error('Transactions not supported by this data source');
    }

    commitTransaction?(): Promise<void> {
        throw new Error('Transactions not supported by this data source');
    }

    rollbackTransaction?(): Promise<void> {
        throw new Error('Transactions not supported by this data source');
    }
}
