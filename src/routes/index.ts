import { Router } from 'express';
import authRoutes from './auth.route';
import reportRoutes from './report.route';
import adminRoutes from './admin.route';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Semua route didaftarkan disini
router.use('/auth', authRoutes);
router.use('/report', requireAuth, reportRoutes);
router.use('/admin', requireAdmin, adminRoutes);

export default router;
