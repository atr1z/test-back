import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { DatabaseConfig, DatabasePool, TransactionCallback } from './types';

/**
 * Create a PostgreSQL connection pool
 * 
 * @param config - Database configuration
 * @returns Database pool with query and close methods
 * 
 * @example
 * ```typescript
 * const db = createDatabasePool({
 *   connectionString: process.env.DATABASE_URL,
 *   max: 20,
 * });
 * 
 * const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
 * ```
 */
export function createDatabasePool(config: DatabaseConfig): DatabasePool {
    const pool = new Pool({
        connectionString: config.connectionString,
        max: config.max ?? 10,
        idleTimeoutMillis: config.idleTimeoutMillis ?? 30000,
        connectionTimeoutMillis: config.connectionTimeoutMillis ?? 2000,
        ...config,
    });

    // Handle pool errors
    pool.on('error', (err) => {
        console.error('Unexpected database pool error:', err);
    });

    return {
        pool,
        /**
         * Execute a query
         */
        async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
            const start = Date.now();
            try {
                const result = await pool.query<T>(text, params);
                const duration = Date.now() - start;

                if (process.env.NODE_ENV === 'development') {
                    console.log('Query executed:', { text, duration, rows: result.rowCount });
                }

                return result;
            } catch (error) {
                console.error('Database query error:', { text, error });
                throw error;
            }
        },
        /**
         * Close the connection pool
         */
        async close(): Promise<void> {
            await pool.end();
        },
    };
}

/**
 * Execute a function within a database transaction
 * 
 * @param pool - Database pool
 * @param callback - Function to execute within transaction
 * @returns Result of the callback function
 * 
 * @example
 * ```typescript
 * const result = await withTransaction(db.pool, async (client) => {
 *   await client.query('INSERT INTO users (name) VALUES ($1)', ['John']);
 *   await client.query('INSERT INTO logs (action) VALUES ($1)', ['user_created']);
 *   return { success: true };
 * });
 * ```
 */
export async function withTransaction<T>(
    pool: Pool,
    callback: TransactionCallback<T>
): Promise<T> {
    const client: PoolClient = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await callback({
            query: <R extends QueryResultRow = any>(text: string, params?: any[]) => client.query<R>(text, params),
        });

        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Test database connection
 * 
 * @param pool - Database pool to test
 * @returns True if connection is successful
 * 
 * @example
 * ```typescript
 * const db = createDatabasePool({ connectionString: process.env.DATABASE_URL });
 * const isConnected = await testConnection(db.pool);
 * ```
 */
export async function testConnection(pool: Pool): Promise<boolean> {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('Database connection successful:', result.rows[0]);
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}

