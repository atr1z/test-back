/**
 * Base Model class with common functionality
 * Provides timestamps, serialization, validation, and lifecycle hooks
 *
 * @example
 * ```typescript
 * export class User extends BaseModel {
 *   id?: string;
 *   email: string;
 *   name: string;
 *   passwordHash: string;
 *
 *   constructor(data: Partial<User> = {}) {
 *     super();
 *     Object.assign(this, data);
 *   }
 *
 *   protected async validate(): Promise<void> {
 *     if (!this.email) {
 *       throw new Error('Email is required');
 *     }
 *     if (!this.name) {
 *       throw new Error('Name is required');
 *     }
 *   }
 *
 *   protected async beforeCreate(): Promise<void> {
 *     this.passwordHash = await hashPassword(this.passwordHash);
 *   }
 * }
 * ```
 */
export abstract class BaseModel {
    // Timestamps
    created_at?: Date;
    updated_at?: Date;

    constructor(data: Partial<BaseModel> = {}) {
        Object.assign(this, data);
    }

    /**
     * Serialize model to JSON
     * Override to customize serialization
     */
    toJSON(): Record<string, any> {
        const json: Record<string, any> = {};

        for (const key in this) {
            if (this.hasOwnProperty(key) && !key.startsWith('_')) {
                const value = (this as any)[key];
                if (value instanceof Date) {
                    json[key] = value.toISOString();
                } else if (value !== undefined) {
                    json[key] = value;
                }
            }
        }

        return json;
    }

    /**
     * Validate model data
     * Override this in subclasses to add validation logic
     */
    protected async validate(): Promise<void> {
        // Default: no validation
    }

    /**
     * Lifecycle hook: before create
     * Override this in subclasses to add pre-create logic
     */
    protected async beforeCreate(): Promise<void> {
        // Default: no pre-create logic
    }

    /**
     * Lifecycle hook: after create
     * Override this in subclasses to add post-create logic
     */
    protected async afterCreate(): Promise<void> {
        // Default: no post-create logic
    }

    /**
     * Lifecycle hook: before update
     * Override this in subclasses to add pre-update logic
     */
    protected async beforeUpdate(): Promise<void> {
        // Default: no pre-update logic
    }

    /**
     * Lifecycle hook: after update
     * Override this in subclasses to add post-update logic
     */
    protected async afterUpdate(): Promise<void> {
        // Default: no post-update logic
    }

    /**
     * Lifecycle hook: before delete
     * Override this in subclasses to add pre-delete logic
     */
    protected async beforeDelete(): Promise<void> {
        // Default: no pre-delete logic
    }

    /**
     * Lifecycle hook: after delete
     * Override this in subclasses to add post-delete logic
     */
    protected async afterDelete(): Promise<void> {
        // Default: no post-delete logic
    }

    /**
     * Check if model is valid
     * Runs validation and returns true/false
     */
    async isValid(): Promise<boolean> {
        try {
            await this.validate();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get validation errors
     * Returns array of error messages
     */
    async getValidationErrors(): Promise<string[]> {
        const errors: string[] = [];

        try {
            await this.validate();
        } catch (error) {
            if (error instanceof Error) {
                // Split combined error messages by semicolon
                const errorMessages = error.message
                    .split(';')
                    .map(msg => msg.trim());
                errors.push(...errorMessages);
            } else {
                errors.push('Validation failed');
            }
        }

        return errors;
    }

    /**
     * Update model with new data
     * Triggers beforeUpdate hook
     */
    async update(data: Partial<this>): Promise<void> {
        await this.beforeUpdate();
        Object.assign(this, data);
    }

    /**
     * Clone the model
     * Creates a new instance with the same data
     */
    clone<T extends BaseModel>(this: T): T {
        const cloned = Object.create(Object.getPrototypeOf(this));
        Object.assign(cloned, this.toJSON());
        return cloned;
    }

    /**
     * Check if model has been modified
     * Compares current state with original data
     */
    isDirty(originalData?: Record<string, any>): boolean {
        if (!originalData) {
            return true; // Assume dirty if no original data
        }

        const currentData = this.toJSON();

        for (const key in currentData) {
            if (currentData[key] !== originalData[key]) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get model as plain object
     * Same as toJSON() but more explicit
     */
    toObject(): Record<string, any> {
        return this.toJSON();
    }

    /**
     * Convert model to string representation
     */
    toString(): string {
        return `${this.constructor.name}(${JSON.stringify(this.toJSON())})`;
    }
}
