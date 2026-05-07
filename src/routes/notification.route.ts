import { Router } from 'express';
import {
  listNotifications,
  markAllRead,
  markRead,
  unreadCount,
} from '../controllers/notification.controller.js';

const router = Router();

// Urutan penting: route literal harus sebelum route dengan parameter (:id)
router.get('/unread-count', unreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
router.get('/', listNotifications);

export default router;
