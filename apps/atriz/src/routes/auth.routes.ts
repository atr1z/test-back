import { Router, type Router as ExpressRouter } from 'express';
import { Login } from '@atriz/core';

const router: ExpressRouter = Router();

router.post('/login', (req, res) => new Login(req, res).handle());

export default router;
