import { Router } from 'express';
import authRoutes from './auth.route.js';
import reportRoutes from './report.route.js';
import adminRoutes from './admin.route.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Semua route didaftarkan disini
router.use('/auth', authRoutes);
router.use('/report', requireAuth, reportRoutes);
router.use('/admin', requireAdmin, adminRoutes);

export default router;
