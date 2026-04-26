import { Router } from 'express';
import {
  getUserProfile,
  updateUserProfile,
} from '../controllers/user.controller.js';
import { profilePictureUploadSchema } from '../utils/validators/user.validator.js';
import {
  createSignedUrlHandler,
  changeProfilePictureHandler,
} from '../controllers/upload.controller.js';
import { user } from '../db/schema.js';

const router = Router();

// Endpoint untuk mendapatkan profil pengguna saat ini
router.get('/profile', getUserProfile);

// Endpoint untuk memperbarui profil pengguna saat ini
router.patch('/profile', updateUserProfile);

// Endpoint untuk mendapatkan signed URL untuk upload foto profil
router.post(
  '/profile-picture/upload-url',
  createSignedUrlHandler('profile_pictures', profilePictureUploadSchema),
);

// Endpoint untuk mengubah foto profil pengguna saat ini
router.patch('/profile-picture', changeProfilePictureHandler(user, 'Pengguna'));

export default router;
