import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseModel } from '../model/index.js';

// Test model class that extends BaseModel
class TestModel extends BaseModel {
    id?: string;
    name!: string;
    email!: string;
    age?: number;
    _privateField?: string;

    constructor(data: Partial<TestModel> = {}) {
        super();
        Object.assign(this, data);
    }

    protected override async validate(): Promise<void> {
        const errors: string[] = [];

        if (!this.name) {
            errors.push('Name is required');
        }
        if (!this.email) {
            errors.push('Email is required');
        }
        if (this.age && this.age < 0) {
            errors.push('Age must be positive');
        }

        if (errors.length > 0) {
            throw new Error(errors.join('; '));
        }
    }

    protected override async beforeCreate(): Promise<void> {
        this.created_at = new Date();
    }

    protected override async afterCreate(): Promise<void> {
        this.updated_at = new Date();
    }

    protected override async beforeUpdate(): Promise<void> {
        this.updated_at = new Date();
    }
}

describe('BaseModel', () => {
    let model: TestModel;

    beforeEach(() => {
        model = new TestModel({
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            age: 30,
        });
    });

    describe('constructor', () => {
        it('should create instance with provided data', () => {
            const data = { name: 'Jane', email: 'jane@example.com' };
            const instance = new TestModel(data);

            expect(instance.name).toBe('Jane');
            expect(instance.email).toBe('jane@example.com');
        });

        it('should create instance with empty data', () => {
            const instance = new TestModel();
            expect(instance).toBeInstanceOf(TestModel);
        });
    });

    describe('toJSON', () => {
        it('should serialize model to JSON', () => {
            const json = model.toJSON();

            expect(json).toHaveProperty('id', '1');
            expect(json).toHaveProperty('name', 'John Doe');
            expect(json).toHaveProperty('email', 'john@example.com');
            expect(json).toHaveProperty('age', 30);
        });

        it('should not include private fields', () => {
            model._privateField = 'secret';
            const json = model.toJSON();

            expect(json).not.toHaveProperty('_privateField');
        });

        it('should convert dates to ISO strings', () => {
            const date = new Date('2023-01-01T00:00:00Z');
            model.created_at = date;

            const json = model.toJSON();
            expect(json['created_at']).toBe(date.toISOString());
        });

        it('should exclude undefined values', () => {
            delete model.age;
            const json = model.toJSON();

            expect(json).not.toHaveProperty('age');
        });
    });

    describe('validate', () => {
        it('should pass validation for valid data', async () => {
            await expect((model as any).validate()).resolves.not.toThrow();
        });

        it('should throw error for missing required fields', async () => {
            model.name = '';
            await expect((model as any).validate()).rejects.toThrow(
                'Name is required'
            );
        });

        it('should throw error for invalid age', async () => {
            model.age = -5;
            await expect((model as any).validate()).rejects.toThrow(
                'Age must be positive'
            );
        });
    });

    describe('isValid', () => {
        it('should return true for valid model', async () => {
            const isValid = await model.isValid();
            expect(isValid).toBe(true);
        });

        it('should return false for invalid model', async () => {
            model.name = '';
            const isValid = await model.isValid();
            expect(isValid).toBe(false);
        });
    });

    describe('getValidationErrors', () => {
        it('should return empty array for valid model', async () => {
            const errors = await model.getValidationErrors();
            expect(errors).toEqual([]);
        });

        it('should return error messages for invalid model', async () => {
            model.name = '';
            const errors = await model.getValidationErrors();
            expect(errors).toContain('Name is required');
        });

        it('should handle multiple validation errors', async () => {
            model.name = '';
            model.email = '';
            const errors = await model.getValidationErrors();
            expect(errors).toContain('Name is required');
            expect(errors).toContain('Email is required');
        });
    });

    describe('update', () => {
        it('should update model with new data', async () => {
            const updateData = { name: 'Jane Doe', age: 25 };
            await model.update(updateData);

            expect(model.name).toBe('Jane Doe');
            expect(model.age).toBe(25);
        });

        it('should trigger beforeUpdate hook', async () => {
            const beforeUpdateSpy = vi.spyOn(model as any, 'beforeUpdate');
            await model.update({ name: 'Updated Name' });

            expect(beforeUpdateSpy).toHaveBeenCalled();
        });
    });

    describe('clone', () => {
        it('should create a clone of the model', () => {
            const cloned = model.clone();

            expect(cloned).toBeInstanceOf(TestModel);
            expect(cloned).not.toBe(model);
            expect(cloned.id).toBe(model.id);
            expect(cloned.name).toBe(model.name);
            expect(cloned.email).toBe(model.email);
        });

        it('should create independent clone', () => {
            const cloned = model.clone();
            cloned.name = 'Different Name';

            expect(model.name).toBe('John Doe');
            expect(cloned.name).toBe('Different Name');
        });
    });

    describe('isDirty', () => {
        it('should return true when no original data provided', () => {
            const isDirty = model.isDirty();
            expect(isDirty).toBe(true);
        });

        it('should return false when data matches original', () => {
            const originalData = model.toJSON();
            const isDirty = model.isDirty(originalData);
            expect(isDirty).toBe(false);
        });

        it('should return true when data differs from original', () => {
            const originalData = model.toJSON();
            model.name = 'Different Name';
            const isDirty = model.isDirty(originalData);
            expect(isDirty).toBe(true);
        });
    });

    describe('toObject', () => {
        it('should return same as toJSON', () => {
            const json = model.toJSON();
            const object = model.toObject();

            expect(object).toEqual(json);
        });
    });

    describe('toString', () => {
        it('should return string representation', () => {
            const str = model.toString();

            expect(str).toContain('TestModel');
            expect(str).toContain('John Doe');
            expect(str).toContain('john@example.com');
        });
    });

    describe('lifecycle hooks', () => {
        it('should call beforeCreate hook', async () => {
            const beforeCreateSpy = vi.spyOn(model as any, 'beforeCreate');
            await (model as any).beforeCreate();

            expect(beforeCreateSpy).toHaveBeenCalled();
        });

        it('should call afterCreate hook', async () => {
            const afterCreateSpy = vi.spyOn(model as any, 'afterCreate');
            await (model as any).afterCreate();

            expect(afterCreateSpy).toHaveBeenCalled();
        });

        it('should call beforeUpdate hook', async () => {
            const beforeUpdateSpy = vi.spyOn(model as any, 'beforeUpdate');
            await (model as any).beforeUpdate();

            expect(beforeUpdateSpy).toHaveBeenCalled();
        });

        it('should call afterUpdate hook', async () => {
            const afterUpdateSpy = vi.spyOn(model as any, 'afterUpdate');
            await (model as any).afterUpdate();

            expect(afterUpdateSpy).toHaveBeenCalled();
        });

        it('should call beforeDelete hook', async () => {
            const beforeDeleteSpy = vi.spyOn(model as any, 'beforeDelete');
            await (model as any).beforeDelete();

            expect(beforeDeleteSpy).toHaveBeenCalled();
        });

        it('should call afterDelete hook', async () => {
            const afterDeleteSpy = vi.spyOn(model as any, 'afterDelete');
            await (model as any).afterDelete();

            expect(afterDeleteSpy).toHaveBeenCalled();
        });
    });
});
