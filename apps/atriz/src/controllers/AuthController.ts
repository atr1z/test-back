import { Response } from 'express';
import { BaseController, ControllerRequest, ParamDefinition } from '@atriz/core';
import { JWTService, PasswordService } from '@atriz/auth';

interface AuthServices {
    jwtService: JWTService;
    passwordService: PasswordService;
}

/**
 * User Registration Controller
 */
export class RegisterController extends BaseController<AuthServices> {
    constructor(req: ControllerRequest, res: Response, services: AuthServices) {
        super(req, res, services);
        this.requiresAuth = false; // No auth required for registration
    }

    protected defineParams(): ParamDefinition[] {
        return [
            {
                name: 'email',
                type: 'email',
                required: true,
            },
            {
                name: 'password',
                type: 'password',
                required: true,
            },
            {
                name: 'name',
                type: 'string',
                required: true,
                min: 2,
                max: 100,
            },
        ];
    }

    protected async execute(): Promise<any> {
        const email = this.getParam<string>('email');
        const password = this.getParam<string>('password');
        const name = this.getParam<string>('name');

        // Hash password
        const hashedPassword = await this.services!.passwordService.hashPassword(password);

        // In a real app, check if user exists and save to database
        const user = {
            id: Math.random().toString(36).substring(7),
            email,
            name,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
        };

        // Generate JWT token
        const token = this.services!.jwtService.generateToken({
            userId: user.id,
            email: user.email,
        });

        return this.created(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                token,
            },
            'User registered successfully'
        );
    }
}

/**
 * User Login Controller
 */
export class LoginController extends BaseController<AuthServices> {
    constructor(req: ControllerRequest, res: Response, services: AuthServices) {
        super(req, res, services);
        this.requiresAuth = false; // No auth required for login
    }

    protected defineParams(): ParamDefinition[] {
        return [
            {
                name: 'email',
                type: 'email',
                required: true,
            },
            {
                name: 'password',
                type: 'string',
                required: true,
            },
        ];
    }

    protected async execute(): Promise<any> {
        const email = this.getParam<string>('email');
        const password = this.getParam<string>('password');

        // In a real app, fetch user from database
        // This is just a mock example
        const mockUser = {
            id: '123',
            email: 'demo@example.com',
            password: await this.services!.passwordService.hashPassword('password123'),
        };

        // Verify credentials
        if (email !== mockUser.email) {
            return this.unauthorized('Invalid credentials');
        }

        const isValidPassword = await this.services!.passwordService.comparePassword(
            password,
            mockUser.password
        );

        if (!isValidPassword) {
            return this.unauthorized('Invalid credentials');
        }

        // Generate JWT token
        const token = this.services!.jwtService.generateToken({
            userId: mockUser.id,
            email: mockUser.email,
        });

        return {
            token,
            user: {
                id: mockUser.id,
                email: mockUser.email,
            },
        };
    }
}

/**
 * Change Password Controller
 */
export class ChangePasswordController extends BaseController<AuthServices> {
    constructor(req: ControllerRequest, res: Response, services: AuthServices) {
        super(req, res, services);
        this.requiresAuth = true;
    }

    protected defineParams(): ParamDefinition[] {
        return [
            {
                name: 'currentPassword',
                type: 'string',
                required: true,
            },
            {
                name: 'newPassword',
                type: 'password',
                required: true,
            },
        ];
    }

    protected async execute(): Promise<any> {
        const currentPassword = this.getParam<string>('currentPassword');
        const newPassword = this.getParam<string>('newPassword');

        // In a real app, verify current password and update in database
        console.log(`User ${this.userId} changing password`);

        const hashedNewPassword = await this.services!.passwordService.hashPassword(newPassword);

        return {
            message: 'Password changed successfully',
        };
    }
}
