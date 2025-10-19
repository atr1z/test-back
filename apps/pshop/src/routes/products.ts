import { Router } from 'express';
import { authMiddleware } from '@mextrack/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', (req, res) => {
  res.json({ message: 'Get products - to be implemented' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create product - to be implemented' });
});

export default router;
