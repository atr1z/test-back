import { Router, type Router as ExpressRouter } from 'express';
import { SignIn } from '../controllers/auth/sign-in';
import { SignUp } from '../controllers/auth/sign-up';
import { RefreshToken } from '../controllers/auth/refresh';
import { PasswordRecovery } from '../controllers/auth/password-recovery';

const router: ExpressRouter = Router();

router.post('/sign-in', (req, res) => new SignIn(req, res).handle());
router.post('/sign-up', (req, res) => new SignUp(req, res).handle());
router.post('/refresh', (req, res) => new RefreshToken(req, res).handle());
router.post('/password-recovery', (req, res) =>
    new PasswordRecovery(req, res).handle()
);

export default router;
