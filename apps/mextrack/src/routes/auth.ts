import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '@mextrack/auth';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.getCurrentUser);

export default router;
