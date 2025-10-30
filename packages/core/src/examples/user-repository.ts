import {
    BaseRepository,
    DatabaseSource,
    CacheSource,
    RepositoryConfig,
} from '../repository';
import { DatabasePool } from '../database';
import { User } from './user-model';
import Redis from 'ioredis';

/**
 * Example User Repository
 * Demonstrates how to create a repository with database and cache sources
 */
export class UserRepository extends BaseRepository<User> {
    constructor(db: DatabasePool, cache?: Redis) {
        // Create database source (primary)
        const dbSource = new DatabaseSource<User>(db, {
            tableName: 'users',
            primaryKey: 'id',
            softDelete: true,
            softDeleteField: 'deleted_at',
            timestamps: {
                createdAt: 'created_at',
                updatedAt: 'updated_at',
            },
        });

        // Create cache source (secondary) if Redis is available
        const fallbackSources = cache
            ? [
                  new CacheSource<User>(cache, {
                      tableName: 'users',
                      primaryKey: 'id',
                      cache: { enabled: true, ttl: 300 }, // 5 minutes
                  }),
              ]
            : [];

        super(dbSource, fallbackSources);
    }

    protected getConfig(): RepositoryConfig {
        return {
            tableName: 'users',
            primaryKey: 'id',
            softDelete: true,
            softDeleteField: 'deleted_at',
            timestamps: {
                createdAt: 'created_at',
                updatedAt: 'updated_at',
            },
            cache: { enabled: true, ttl: 300 },
        };
    }

    /**
     * Transform database row to User model
     */
    protected override toDomain(row: any): User {
        return User.fromDatabase(row);
    }

    /**
     * Transform User model to database row
     */
    protected override toDatabase(entity: Partial<User>): any {
        if (entity instanceof User) {
            return entity.toDatabase();
        }
        return entity;
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.findOne({
            where: { email: email.toLowerCase() },
        });
    }

    /**
     * Find active users
     */
    async findActiveUsers(): Promise<User[]> {
        return this.findAll({
            where: { is_active: true },
            orderBy: [{ field: 'created_at', direction: 'DESC' }],
        });
    }

    /**
     * Find users by role
     */
    async findByRole(role: string): Promise<User[]> {
        return this.findAll({
            where: { role, is_active: true },
            orderBy: [{ field: 'name', direction: 'ASC' }],
        });
    }

    /**
     * Count users by role
     */
    async countByRole(role: string): Promise<number> {
        return this.count({
            where: { role, is_active: true },
        });
    }

    /**
     * Update user's last login time
     */
    async updateLastLogin(userId: string): Promise<User | null> {
        return this.update(userId, {
            lastLoginAt: new Date(),
        } as Partial<User>);
    }

    /**
     * Deactivate user (soft delete)
     */
    async deactivateUser(userId: string): Promise<boolean> {
        return (
            this.update(userId, {
                isActive: false,
            } as Partial<User>) !== null
        );
    }

    /**
     * Activate user
     */
    async activateUser(userId: string): Promise<boolean> {
        return (
            this.update(userId, {
                isActive: true,
            } as Partial<User>) !== null
        );
    }

    /**
     * Search users by name or email
     */
    async searchUsers(query: string): Promise<User[]> {
        // Use raw query for complex search
        const results = await this.raw(
            `
            SELECT * FROM users 
            WHERE (name ILIKE $1 OR email ILIKE $1) 
            AND is_active = true 
            AND deleted_at IS NULL
            ORDER BY name ASC
        `,
            [`%${query}%`]
        );

        return results.map((row: any) => this.toDomain(row));
    }

    /**
     * Get user statistics
     */
    async getUserStats(): Promise<{
        total: number;
        active: number;
        byRole: Record<string, number>;
    }> {
        const [total, active, byRole] = await Promise.all([
            this.count(),
            this.count({ where: { is_active: true } }),
            this.getRoleStats(),
        ]);

        return { total, active, byRole };
    }

    /**
     * Get user count by role
     */
    private async getRoleStats(): Promise<Record<string, number>> {
        const results = await this.raw(`
            SELECT role, COUNT(*) as count 
            FROM users 
            WHERE is_active = true AND deleted_at IS NULL
            GROUP BY role
        `);

        const stats: Record<string, number> = {};
        results.forEach((row: any) => {
            stats[row.role] = parseInt(row.count);
        });

        return stats;
    }

    /**
     * Create user with validation
     */
    async createUser(userData: Partial<User>): Promise<User> {
        const user = new User(userData);

        // Validate before creating
        if (!(await user.isValid())) {
            const errors = await user.getValidationErrors();
            throw new Error(`Validation failed: ${errors.join(', ')}`);
        }

        return this.create(userData);
    }

    /**
     * Update user with validation
     */
    async updateUser(
        userId: string,
        userData: Partial<User>
    ): Promise<User | null> {
        const existingUser = await this.findById(userId);
        if (!existingUser) {
            return null;
        }

        // Create updated user instance
        const updatedUser = new User({ ...existingUser, ...userData });

        // Validate before updating
        if (!(await updatedUser.isValid())) {
            const errors = await updatedUser.getValidationErrors();
            throw new Error(`Validation failed: ${errors.join(', ')}`);
        }

        return this.update(userId, userData);
    }
}
