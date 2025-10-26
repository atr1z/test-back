import { Pool, QueryResult } from 'pg';

/**
 * TimescaleDB utilities for time-series data management
 * 
 * @module timescale
 */

/**
 * Enable TimescaleDB extension on a database
 * This should be run once during database setup
 * 
 * @param pool - Database connection pool
 * @returns Query result
 * 
 * @example
 * ```typescript
 * const trackingDb = createDatabasePool({ connectionString: process.env.TRACKING_DB_URL });
 * await enableTimescaleDB(trackingDb.pool);
 * ```
 */
export async function enableTimescaleDB(pool: Pool): Promise<QueryResult> {
    try {
        const result = await pool.query('CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE');
        console.log('✓ TimescaleDB extension enabled');
        return result;
    } catch (error) {
        console.error('Failed to enable TimescaleDB extension:', error);
        throw error;
    }
}

/**
 * Convert a regular PostgreSQL table to a TimescaleDB hypertable
 * 
 * @param pool - Database connection pool
 * @param tableName - Name of the table to convert
 * @param timeColumn - Name of the time column (default: 'time')
 * @param chunkTimeInterval - Chunk interval (default: '7 days')
 * @returns Query result
 * 
 * @example
 * ```typescript
 * await createHypertable(trackingDb.pool, 'location_events', 'time', '1 day');
 * ```
 */
export async function createHypertable(
    pool: Pool,
    tableName: string,
    timeColumn: string = 'time',
    chunkTimeInterval: string = '7 days'
): Promise<QueryResult> {
    try {
        const result = await pool.query(
            `SELECT create_hypertable($1, $2, chunk_time_interval => INTERVAL $3, if_not_exists => TRUE)`,
            [tableName, timeColumn, chunkTimeInterval]
        );
        console.log(`✓ Hypertable created: ${tableName} (chunked by ${chunkTimeInterval})`);
        return result;
    } catch (error) {
        console.error(`Failed to create hypertable ${tableName}:`, error);
        throw error;
    }
}

/**
 * Add automatic data retention policy to a hypertable
 * Old data will be automatically dropped after the retention period
 * 
 * @param pool - Database connection pool
 * @param tableName - Name of the hypertable
 * @param retentionPeriod - How long to keep data (e.g., '30 days', '1 year')
 * @returns Query result
 * 
 * @example
 * ```typescript
 * // Auto-delete data older than 30 days
 * await addRetentionPolicy(trackingDb.pool, 'location_events', '30 days');
 * ```
 */
export async function addRetentionPolicy(
    pool: Pool,
    tableName: string,
    retentionPeriod: string
): Promise<QueryResult> {
    try {
        const result = await pool.query(
            `SELECT add_retention_policy($1, INTERVAL $2, if_not_exists => TRUE)`,
            [tableName, retentionPeriod]
        );
        console.log(`✓ Retention policy added: ${tableName} (keep ${retentionPeriod})`);
        return result;
    } catch (error) {
        console.error(`Failed to add retention policy to ${tableName}:`, error);
        throw error;
    }
}

/**
 * Remove retention policy from a hypertable
 * 
 * @param pool - Database connection pool
 * @param tableName - Name of the hypertable
 * @returns Query result
 */
export async function removeRetentionPolicy(
    pool: Pool,
    tableName: string
): Promise<QueryResult> {
    try {
        const result = await pool.query(
            `SELECT remove_retention_policy($1, if_exists => TRUE)`,
            [tableName]
        );
        console.log(`✓ Retention policy removed from: ${tableName}`);
        return result;
    } catch (error) {
        console.error(`Failed to remove retention policy from ${tableName}:`, error);
        throw error;
    }
}

/**
 * Enable compression on a hypertable for older data
 * Compression can save 10-20x storage space
 * 
 * @param pool - Database connection pool
 * @param tableName - Name of the hypertable
 * @param compressAfter - Compress data older than this (e.g., '7 days')
 * @param segmentBy - Columns to segment by for better compression (optional)
 * @param orderBy - Columns to order by (optional)
 * @returns Query result
 * 
 * @example
 * ```typescript
 * // Compress data older than 7 days, segmented by device_id
 * await enableCompression(
 *   trackingDb.pool,
 *   'location_events',
 *   '7 days',
 *   ['device_id', 'user_id'],
 *   ['time DESC']
 * );
 * ```
 */
export async function enableCompression(
    pool: Pool,
    tableName: string,
    compressAfter: string,
    segmentBy?: string[],
    orderBy?: string[]
): Promise<QueryResult> {
    try {
        // Set compression policy
        let alterQuery = `ALTER TABLE ${tableName} SET (timescaledb.compress = true`;
        
        if (segmentBy && segmentBy.length > 0) {
            alterQuery += `, timescaledb.compress_segmentby = '${segmentBy.join(',')}'`;
        }
        
        if (orderBy && orderBy.length > 0) {
            alterQuery += `, timescaledb.compress_orderby = '${orderBy.join(',')}'`;
        }
        
        alterQuery += ')';
        
        await pool.query(alterQuery);
        
        // Add compression policy
        const result = await pool.query(
            `SELECT add_compression_policy($1, INTERVAL $2, if_not_exists => TRUE)`,
            [tableName, compressAfter]
        );
        
        console.log(`✓ Compression enabled: ${tableName} (compress after ${compressAfter})`);
        return result;
    } catch (error) {
        console.error(`Failed to enable compression on ${tableName}:`, error);
        throw error;
    }
}

/**
 * Create a continuous aggregate (materialized view that auto-updates)
 * Useful for pre-computing aggregations like hourly/daily stats
 * 
 * @param pool - Database connection pool
 * @param viewName - Name for the continuous aggregate
 * @param query - SELECT query for the aggregate
 * @param retentionPeriod - Optional retention policy for the aggregate
 * @returns Query result
 * 
 * @example
 * ```typescript
 * await createContinuousAggregate(
 *   trackingDb.pool,
 *   'location_hourly',
 *   `
 *     SELECT
 *       time_bucket('1 hour', time) AS hour,
 *       device_id,
 *       COUNT(*) as point_count,
 *       AVG(speed) as avg_speed
 *     FROM location_events
 *     GROUP BY hour, device_id
 *   `,
 *   '1 year'
 * );
 * ```
 */
export async function createContinuousAggregate(
    pool: Pool,
    viewName: string,
    query: string,
    retentionPeriod?: string
): Promise<QueryResult> {
    try {
        // Create the continuous aggregate
        const createQuery = `
            CREATE MATERIALIZED VIEW IF NOT EXISTS ${viewName}
            WITH (timescaledb.continuous) AS
            ${query}
        `;
        
        await pool.query(createQuery);
        console.log(`✓ Continuous aggregate created: ${viewName}`);
        
        // Add retention policy if specified
        if (retentionPeriod) {
            await addRetentionPolicy(pool, viewName, retentionPeriod);
        }
        
        return await pool.query('SELECT 1');
    } catch (error) {
        console.error(`Failed to create continuous aggregate ${viewName}:`, error);
        throw error;
    }
}

/**
 * Get information about hypertables in the database
 * 
 * @param pool - Database connection pool
 * @returns List of hypertables with metadata
 */
export async function getHypertableInfo(pool: Pool): Promise<QueryResult> {
    return pool.query(`
        SELECT 
            ht.schema_name,
            ht.table_name,
            t.tableowner,
            pg_size_pretty(hypertable_size(format('%I.%I', ht.schema_name, ht.table_name)::regclass)) AS total_size,
            (SELECT count(*) FROM timescaledb_information.chunks c WHERE c.hypertable_name = ht.table_name) AS num_chunks
        FROM timescaledb_information.hypertables ht
        JOIN pg_tables t ON t.schemaname = ht.schema_name AND t.tablename = ht.table_name
        ORDER BY ht.table_name;
    `);
}

/**
 * Manually compress chunks older than a specific time
 * 
 * @param pool - Database connection pool
 * @param tableName - Name of the hypertable
 * @param olderThan - Compress chunks older than this (e.g., '7 days')
 * @returns Query result
 */
export async function compressChunks(
    pool: Pool,
    tableName: string,
    olderThan: string
): Promise<QueryResult> {
    try {
        const result = await pool.query(
            `SELECT compress_chunk(i, if_not_compressed => true)
             FROM show_chunks($1, older_than => INTERVAL $2) i`,
            [tableName, olderThan]
        );
        console.log(`✓ Compressed chunks for ${tableName} older than ${olderThan}`);
        return result;
    } catch (error) {
        console.error(`Failed to compress chunks for ${tableName}:`, error);
        throw error;
    }
}
