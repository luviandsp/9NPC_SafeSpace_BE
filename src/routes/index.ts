import { Router } from 'express';
import authRoutes from './auth.route.js';
import reportRoutes from './report.route.js';
import adminRoutes from './admin.route.js';
import userRoutes from './user.route.js';
import notificationRoutes from './notification.route.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Semua route didaftarkan disini
router.use('/auth', authRoutes);
router.use('/report', requireAuth, reportRoutes);
router.use('/user', requireAuth, userRoutes);
router.use('/admin', requireAdmin, adminRoutes);
router.use('/notifications', requireAuth, notificationRoutes);

export default router;
