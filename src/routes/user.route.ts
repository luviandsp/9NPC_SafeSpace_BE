import { Router } from 'express';
import {
  getUserProfile,
  updateUserProfile,
} from '../controllers/user.controller.js';

const router = Router();

// Endpoint untuk mendapatkan profil pengguna saat ini
router.get('/profile', getUserProfile);

// Endpoint untuk memperbarui profil pengguna saat ini
router.patch('/profile', updateUserProfile);

export default router;
