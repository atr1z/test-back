import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';

/**
 * Database configuration options
 */
export interface DatabaseConfig extends PoolConfig {
    /**
     * PostgreSQL connection string
     * Format: postgresql://user:password@host:port/database
     */
    connectionString?: string;
    /**
     * Maximum number of clients in the pool
     * @default 10
     */
    max?: number;
    /**
     * Idle timeout in milliseconds
     * @default 30000
     */
    idleTimeoutMillis?: number;
    /**
     * Connection timeout in milliseconds
     * @default 2000
     */
    connectionTimeoutMillis?: number;
}

/**
 * Database connection pool interface
 */
export interface DatabasePool {
    pool: Pool;
    query<T extends QueryResultRow = any>(
        text: string,
        params?: any[]
    ): Promise<QueryResult<T>>;
    close(): Promise<void>;
}

/**
 * Migration configuration
 */
export interface MigrationConfig {
    /**
     * Database URL for migrations
     */
    databaseUrl: string;
    /**
     * Directory containing migration files
     */
    migrationsDir: string;
    /**
     * Migration table name
     * @default 'pgmigrations'
     */
    migrationsTable?: string;
    /**
     * Schema for migrations table
     * @default 'public'
     */
    schema?: string;
    /**
     * Direction of migration
     */
    direction?: 'up' | 'down';
    /**
     * Number of migrations to run
     */
    count?: number;
}

/**
 * Seed configuration
 */
export interface SeedConfig {
    /**
     * Database URL for seeding
     */
    databaseUrl: string;
    /**
     * Directory containing seed files
     */
    seedsDir: string;
}

/**
 * Query parameters type
 */
export type QueryParams = any[];

/**
 * Transaction callback function
 */
export type TransactionCallback<T> = (client: {
    query<R extends QueryResultRow = any>(
        text: string,
        params?: QueryParams
    ): Promise<QueryResult<R>>;
}) => Promise<T>;
