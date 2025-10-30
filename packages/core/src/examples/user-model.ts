import { BaseModel } from '../model';

/**
 * Example User model
 * Demonstrates how to extend BaseModel with validation and lifecycle hooks
 */
export class User extends BaseModel {
    id?: string;
    email!: string;
    name!: string;
    passwordHash!: string;
    role!: string;
    isActive!: boolean;
    lastLoginAt?: Date;

    constructor(data: Partial<User> = {}) {
        super();
        Object.assign(this, data);
    }

    /**
     * Validate user data
     */
    protected override async validate(): Promise<void> {
        if (!this.email) {
            throw new Error('Email is required');
        }

        if (!this.email.includes('@')) {
            throw new Error('Email must be valid');
        }

        if (!this.name) {
            throw new Error('Name is required');
        }

        if (this.name.length < 2) {
            throw new Error('Name must be at least 2 characters');
        }

        if (!this.passwordHash) {
            throw new Error('Password hash is required');
        }

        if (!this.role) {
            throw new Error('Role is required');
        }

        const validRoles = ['admin', 'user', 'manager'];
        if (!validRoles.includes(this.role)) {
            throw new Error(`Role must be one of: ${validRoles.join(', ')}`);
        }
    }

    /**
     * Hash password before creating user
     */
    protected override async beforeCreate(): Promise<void> {
        // In a real implementation, you would hash the password here
        // this.passwordHash = await hashPassword(this.passwordHash);

        // Set default values
        this.isActive = this.isActive ?? true;
        this.role = this.role ?? 'user';
    }

    /**
     * Update last login time
     */
    async updateLastLogin(): Promise<void> {
        this.lastLoginAt = new Date();
    }

    /**
     * Check if user is admin
     */
    isAdmin(): boolean {
        return this.role === 'admin';
    }

    /**
     * Check if user is active
     */
    isUserActive(): boolean {
        return this.isActive;
    }

    /**
     * Get user display name
     */
    getDisplayName(): string {
        return this.name || this.email?.split('@')[0] || 'Unknown';
    }

    /**
     * Serialize user for API responses (exclude sensitive data)
     */
    override toJSON(): Record<string, any> {
        const json = super.toJSON();

        // Remove sensitive fields
        delete json['passwordHash'];

        return json;
    }

    /**
     * Create a user instance from database row
     */
    static fromDatabase(row: any): User {
        return new User({
            id: row.id,
            email: row.email,
            name: row.name,
            passwordHash: row.password_hash,
            role: row.role,
            isActive: row.is_active,
            lastLoginAt: row.last_login_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
        });
    }

    /**
     * Convert to database format
     */
    toDatabase(): Record<string, any> {
        return {
            id: this.id,
            email: this.email,
            name: this.name,
            password_hash: this.passwordHash,
            role: this.role,
            is_active: this.isActive,
            last_login_at: this.lastLoginAt,
            created_at: this.created_at,
            updated_at: this.updated_at,
        };
    }
}
