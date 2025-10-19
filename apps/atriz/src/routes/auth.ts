import { Router, Request, Response } from 'express';
import { asyncHandler } from '@atriz/core';
import { JWTService, PasswordService } from '@atriz/auth';

export default (jwtService: JWTService, passwordService: PasswordService): Router => {
    const router = Router();

    /**
     * POST /api/auth/register
     * Example registration endpoint
     */
    router.post(
        '/register',
        asyncHandler(async (req: Request, res: Response) => {
            const { email, password, name } = req.body;

            // Validate input
            if (!email || !password || !name) {
                res.status(400).json({
                    message: 'Email, password, and name are required',
                    statusCode: 400,
                });
                return;
            }

            // Hash password
            const hashedPassword = await passwordService.hashPassword(password);

            // In a real app, you would save the user to a database here
            const user = {
                id: Math.random().toString(36).substring(7),
                email,
                name,
                password: hashedPassword,
            };

            // Generate JWT token
            const token = jwtService.generateToken({
                userId: user.id,
                email: user.email,
            });

            res.status(201).json({
                message: 'User registered successfully',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                    },
                    token,
                },
            });
        })
    );

    /**
     * POST /api/auth/login
     * Example login endpoint
     */
    router.post(
        '/login',
        asyncHandler(async (req: Request, res: Response) => {
            const { email, password } = req.body;

            // Validate input
            if (!email || !password) {
                res.status(400).json({
                    message: 'Email and password are required',
                    statusCode: 400,
                });
                return;
            }

            // In a real app, you would fetch the user from database
            // This is just an example
            const mockUser = {
                id: '123',
                email: 'demo@example.com',
                password: await passwordService.hashPassword('password123'),
            };

            // Verify password
            const isValid = await passwordService.comparePassword(password, mockUser.password);

            if (!isValid || email !== mockUser.email) {
                res.status(401).json({
                    message: 'Invalid credentials',
                    statusCode: 401,
                });
                return;
            }

            // Generate JWT token
            const token = jwtService.generateToken({
                userId: mockUser.id,
                email: mockUser.email,
            });

            res.json({
                message: 'Login successful',
                data: {
                    token,
                },
            });
        })
    );

    return router;
};
