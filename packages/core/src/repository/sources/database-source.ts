import { DatabasePool } from '../../database/index.js';
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
 * PostgreSQL database data source
 * Primary source for all data operations
 */
export class DatabaseSource<T> extends BaseDataSource<T> {
    private config: RepositoryConfig;

    constructor(
        private db: DatabasePool,
        config: Partial<RepositoryConfig>
    ) {
        super();
        this.config = {
            tableName: config.tableName || '',
            primaryKey: config.primaryKey || 'id',
            softDelete: config.softDelete || false,
            softDeleteField: config.softDeleteField || 'deleted_at',
            timestamps: config.timestamps || {
                createdAt: 'created_at',
                updatedAt: 'updated_at',
            },
            ...config,
        };
    }

    getMetadata(): SourceMetadata {
        return {
            name: 'database',
            priority: SourcePriority.PRIMARY,
            type: 'database',
            healthy: true,
        };
    }

    getCapabilities(): SourceCapabilities {
        return {
            read: true,
            write: true,
            delete: true,
            transaction: true,
        };
    }

    async isHealthy(): Promise<boolean> {
        try {
            await this.db.query('SELECT 1');
            return true;
        } catch {
            return false;
        }
    }

    async findById(id: string | number): Promise<T | null> {
        const whereClause = this.buildWhereClause({
            [this.config.primaryKey!]: id,
        });
        const query = `SELECT * FROM ${this.config.tableName} WHERE ${whereClause} LIMIT 1`;

        const result = await this.db.query(query);
        return result.rows[0] || null;
    }

    async findOne(filters: QueryFilters): Promise<T | null> {
        const whereClause = this.buildWhereClause(filters.where || {});
        const query = `SELECT * FROM ${this.config.tableName} WHERE ${whereClause} LIMIT 1`;

        const result = await this.db.query(query);
        return result.rows[0] || null;
    }

    async findAll(filters?: QueryFilters): Promise<T[]> {
        let query = `SELECT * FROM ${this.config.tableName}`;
        const params: any[] = [];

        if (filters?.where) {
            const whereClause = this.buildWhereClause(filters.where);
            query += ` WHERE ${whereClause}`;
        }

        if (filters?.orderBy) {
            const orderClause = this.buildOrderClause(filters.orderBy);
            query += ` ORDER BY ${orderClause}`;
        }

        if (filters?.limit) {
            query += ` LIMIT ${filters.limit}`;
        }

        if (filters?.offset) {
            query += ` OFFSET ${filters.offset}`;
        }

        const result = await this.db.query(query, params);
        return result.rows;
    }

    async findPaginated(
        filters: QueryFilters,
        pagination: PaginationOptions
    ): Promise<PaginatedResult<T>> {
        const { page, perPage } = pagination;
        const offset = (page - 1) * perPage;

        // Get total count
        const countQuery = this.buildCountQuery(filters);
        const countResult = await this.db.query(countQuery);
        const total = parseInt(countResult.rows[0].count);

        // Get data
        const dataFilters = { ...filters, limit: perPage, offset };
        const data = await this.findAll(dataFilters);

        return {
            data,
            pagination: {
                page,
                perPage,
                total,
                totalPages: Math.ceil(total / perPage),
            },
        };
    }

    async create(data: Partial<T>): Promise<T> {
        const { sql, params } = this.buildInsertQuery(data);
        const result = await this.db.query(sql, params);
        return result.rows[0];
    }

    async update(id: string | number, data: Partial<T>): Promise<T | null> {
        const { sql, params } = this.buildUpdateQuery(id, data);
        const result = await this.db.query(sql, params);
        return result.rows[0] || null;
    }

    async delete(id: string | number): Promise<boolean> {
        if (this.config.softDelete) {
            // Soft delete
            const softDeleteData = {
                [this.config.softDeleteField!]: new Date(),
            } as Partial<T>;

            const result = await this.update(id, softDeleteData);
            return result !== null;
        } else {
            // Hard delete
            const query = `DELETE FROM ${this.config.tableName} WHERE ${this.config.primaryKey} = $1`;
            const result = await this.db.query(query, [id]);
            return result.rowCount! > 0;
        }
    }

    async count(filters?: QueryFilters): Promise<number> {
        const query = this.buildCountQuery(filters);
        const result = await this.db.query(query);
        return parseInt(result.rows[0].count);
    }

    async exists(id: string | number): Promise<boolean> {
        const query = `SELECT 1 FROM ${this.config.tableName} WHERE ${this.config.primaryKey} = $1 LIMIT 1`;
        const result = await this.db.query(query, [id]);
        return result.rows.length > 0;
    }

    override async raw(query: string, params?: any[]): Promise<any> {
        const result = await this.db.query(query, params);
        return result.rows;
    }

    override async beginTransaction(): Promise<void> {
        await this.db.query('BEGIN');
    }

    override async commitTransaction(): Promise<void> {
        await this.db.query('COMMIT');
    }

    override async rollbackTransaction(): Promise<void> {
        await this.db.query('ROLLBACK');
    }

    private buildWhereClause(conditions: Record<string, any>): string {
        if (Object.keys(conditions).length === 0) {
            return '1=1';
        }

        const clauses: string[] = [];
        Object.entries(conditions).forEach(([key, value], index) => {
            if (value === null) {
                clauses.push(`${key} IS NULL`);
            } else if (Array.isArray(value)) {
                const placeholders = value
                    .map((_, i) => `$${index + i + 1}`)
                    .join(', ');
                clauses.push(`${key} IN (${placeholders})`);
            } else {
                clauses.push(`${key} = $${index + 1}`);
            }
        });

        return clauses.join(' AND ');
    }

    private buildOrderClause(
        orderBy: { field: string; direction: 'ASC' | 'DESC' }[]
    ): string {
        return orderBy
            .map(({ field, direction }) => `${field} ${direction}`)
            .join(', ');
    }

    private buildCountQuery(filters?: QueryFilters): string {
        let query = `SELECT COUNT(*) as count FROM ${this.config.tableName}`;

        if (filters?.where) {
            const whereClause = this.buildWhereClause(filters.where);
            query += ` WHERE ${whereClause}`;
        }

        return query;
    }

    private buildInsertQuery(data: Partial<T>): { sql: string; params: any[] } {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields
            .map((_, index) => `$${index + 1}`)
            .join(', ');

        const sql = `INSERT INTO ${this.config.tableName} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;

        return { sql, params: values };
    }

    private buildUpdateQuery(
        id: string | number,
        data: Partial<T>
    ): { sql: string; params: any[] } {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const setClause = fields
            .map((field, index) => `${field} = $${index + 1}`)
            .join(', ');

        const sql = `UPDATE ${this.config.tableName} SET ${setClause} WHERE ${this.config.primaryKey} = $${fields.length + 1} RETURNING *`;

        return { sql, params: [...values, id] };
    }
}
