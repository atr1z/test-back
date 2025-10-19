import { Router } from 'express';
import { resolve } from '@atriz/core';
import { JWTService, PasswordService, AUTH_TOKENS } from '@atriz/auth';
import { RegisterController, LoginController, ChangePasswordController } from '../controllers';

export default (): Router => {
    const router = Router();

    // Resolve services from DI container
    const jwtService = resolve<JWTService>(AUTH_TOKENS.JWTService);
    const passwordService = resolve<PasswordService>(AUTH_TOKENS.PasswordService);
    const services = { jwtService, passwordService };

    /**
     * POST /api/auth/register
     * Register a new user
     */
    router.post('/register', (req, res) => {
        const controller = new RegisterController(req, res, services);
        return controller.handle();
    });

    /**
     * POST /api/auth/login
     * Login user
     */
    router.post('/login', (req, res) => {
        const controller = new LoginController(req, res, services);
        return controller.handle();
    });

    /**
     * POST /api/auth/change-password
     * Change user password (requires authentication)
     */
    router.post('/change-password', (req, res) => {
        const controller = new ChangePasswordController(req, res, services);
        return controller.handle();
    });

    return router;
};
