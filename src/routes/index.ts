import { Router } from 'express';
import authRoutes from './auth.route';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Semua route didaftarkan disini
router.use('/auth', authRoutes);

export default router;
