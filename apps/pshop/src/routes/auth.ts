import { Router } from 'express';
import { authMiddleware } from '@mextrack/auth';

const router = Router();

// Auth routes (can be shared with mextrack or customized)
router.get('/me', authMiddleware, (req, res) => {
  res.json({ message: 'Auth route - to be implemented' });
});

export default router;
