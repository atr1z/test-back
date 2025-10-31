import {
    DatabasePool,
    DatabaseConfig,
    createDatabasePool,
    testConnection,
} from '../database/index.js';

/**
 * Database service for managing multiple database connections
 * Singleton pattern for centralized database management
 *
 * @example
 * ```typescript
 * const dbService = new DatabaseService();
 *
 * // Register databases
 * dbService.registerDatabase('core', {
 *   connectionString: process.env.CORE_DATABASE_URL
 * });
 *
 * dbService.registerDatabase('tracking', {
 *   connectionString: process.env.TRACKING_DATABASE_URL
 * });
 *
 * // Use in repositories
 * const coreDb = dbService.getDatabase('core');
 * const trackingDb = dbService.getDatabase('tracking');
 * ```
 */
export class DatabaseService {
    private static instance: DatabaseService;
    private pools: Map<string, DatabasePool> = new Map();

    private constructor() {}

    /**
     * Get singleton instance
     */
    static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    /**
     * Register a database connection
     *
     * @param name - Database name (e.g., 'core', 'tracking', 'followsite')
     * @param config - Database configuration
     */
    registerDatabase(name: string, config: DatabaseConfig): void {
        if (this.pools.has(name)) {
            console.warn(
                `Database '${name}' is already registered. Closing existing connection.`
            );
            this.pools.get(name)?.close();
        }

        const pool = createDatabasePool(config);
        this.pools.set(name, pool);

        console.log(`✓ Database '${name}' registered`);
    }

    /**
     * Get database pool by name
     *
     * @param name - Database name
     * @returns Database pool
     * @throws Error if database not found
     */
    getDatabase(name: string): DatabasePool {
        const pool = this.pools.get(name);

        if (!pool) {
            throw new Error(
                `Database '${name}' not found. Available databases: ${Array.from(this.pools.keys()).join(', ')}`
            );
        }

        return pool;
    }

    /**
     * Check if database is registered
     *
     * @param name - Database name
     * @returns True if registered
     */
    hasDatabase(name: string): boolean {
        return this.pools.has(name);
    }

    /**
     * Get all registered database names
     *
     * @returns Array of database names
     */
    getDatabaseNames(): string[] {
        return Array.from(this.pools.keys());
    }

    /**
     * Test all database connections
     *
     * @returns Map of database names to connection status
     */
    async testConnections(): Promise<Map<string, boolean>> {
        const results = new Map<string, boolean>();

        for (const [name, pool] of this.pools) {
            try {
                const isConnected = await testConnection(pool.pool);
                results.set(name, isConnected);
            } catch (error) {
                console.error(
                    `Database '${name}' connection test failed:`,
                    error
                );
                results.set(name, false);
            }
        }

        return results;
    }

    /**
     * Test a specific database connection
     *
     * @param name - Database name
     * @returns True if connection is successful
     */
    async testConnection(name: string): Promise<boolean> {
        const pool = this.pools.get(name);

        if (!pool) {
            throw new Error(`Database '${name}' not found`);
        }

        return testConnection(pool.pool);
    }

    /**
     * Close a specific database connection
     *
     * @param name - Database name
     */
    async closeDatabase(name: string): Promise<void> {
        const pool = this.pools.get(name);

        if (pool) {
            await pool.close();
            this.pools.delete(name);
            console.log(`✓ Database '${name}' closed`);
        }
    }

    /**
     * Close all database connections
     */
    async closeAll(): Promise<void> {
        const closePromises = Array.from(this.pools.entries()).map(
            async ([name, pool]) => {
                try {
                    await pool.close();
                    console.log(`✓ Database '${name}' closed`);
                } catch (error) {
                    console.error(`Error closing database '${name}':`, error);
                }
            }
        );

        await Promise.all(closePromises);
        this.pools.clear();
    }

    /**
     * Get database statistics
     *
     * @returns Database statistics
     */
    getStats(): Record<string, any> {
        const stats: Record<string, any> = {};

        for (const [name, pool] of this.pools) {
            stats[name] = {
                totalCount: pool.pool.totalCount,
                idleCount: pool.pool.idleCount,
                waitingCount: pool.pool.waitingCount,
            };
        }

        return stats;
    }

    /**
     * Health check for all databases
     *
     * @returns Health status for all databases
     */
    async healthCheck(): Promise<
        Record<string, { healthy: boolean; error?: string }>
    > {
        const health: Record<string, { healthy: boolean; error?: string }> = {};

        for (const [name, pool] of this.pools) {
            try {
                const isHealthy = await testConnection(pool.pool);
                health[name] = { healthy: isHealthy };
            } catch (error) {
                health[name] = {
                    healthy: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                };
            }
        }

        return health;
    }
}
