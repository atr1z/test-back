import { Response } from 'express';
import { BaseController, ControllerRequest, ParamDefinition } from '@atriz/core';
import { JWTService, PasswordService } from '@atriz/auth';

interface UserServices {
    jwtService: JWTService;
    passwordService: PasswordService;
}

/**
 * Example: Get User Profile Controller
 */
export class GetUserProfileController extends BaseController<UserServices> {
    constructor(req: ControllerRequest, res: Response, services: UserServices) {
        super(req, res, services);
        this.requiresAuth = true; // Requires authentication
    }

    protected defineParams(): ParamDefinition[] {
        // No body params needed, but we could validate URL params if needed
        return [];
    }

    protected async execute(): Promise<any> {
        // In a real app, you would fetch from database
        // For now, return mock user data
        return {
            user: {
                id: this.userId,
                email: this.userEmail,
                name: 'John Doe',
                createdAt: new Date().toISOString(),
            },
        };
    }
}

/**
 * Example: Update User Profile Controller
 */
export class UpdateUserProfileController extends BaseController<UserServices> {
    constructor(req: ControllerRequest, res: Response, services: UserServices) {
        super(req, res, services);
        this.requiresAuth = true;
    }

    protected defineParams(): ParamDefinition[] {
        return [
            {
                name: 'name',
                type: 'string',
                required: false,
                min: 2,
                max: 100,
            },
            {
                name: 'phone',
                type: 'phone',
                required: false,
            },
            {
                name: 'bio',
                type: 'string',
                required: false,
                max: 500,
                canBeEmpty: true,
            },
        ];
    }

    protected async execute(): Promise<any> {
        const name = this.getParam<string>('name');
        const phone = this.getParam<string>('phone');
        const bio = this.getParam<string>('bio');

        // In a real app, update database here
        console.log(`Updating user ${this.userId}:`, { name, phone, bio });

        return {
            user: {
                id: this.userId,
                email: this.userEmail,
                name: name || 'John Doe',
                phone,
                bio,
                updatedAt: new Date().toISOString(),
            },
        };
    }
}

/**
 * Example: Get User by ID Controller (with URL params)
 */
export class GetUserByIdController extends BaseController<UserServices> {
    constructor(req: ControllerRequest, res: Response, services: UserServices) {
        super(req, res, services);
        this.requiresAuth = true;
    }

    protected defineParams(): ParamDefinition[] {
        return [];
    }

    protected async execute(): Promise<any> {
        const userId = this.getUrlParam('id');

        if (!userId) {
            return this.notFound('User not found');
        }

        // In a real app, fetch from database
        return {
            user: {
                id: userId,
                email: 'example@example.com',
                name: 'Example User',
            },
        };
    }
}
