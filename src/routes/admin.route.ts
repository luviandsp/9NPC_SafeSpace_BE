import { Router } from 'express';
import {
  getAdminProfile,
  getAllReports,
  getReportById,
  updateAdminProfile,
  updateStatusReport,
} from '../controllers/admin.controller.js';
import {
  changeProfilePictureHandler,
  createSignedUrlHandler,
} from '../controllers/upload.controller.js';
import { profilePictureUploadSchema } from '../utils/validators/user.validator.js';
import { admin } from '../db/schema.js';

const router = Router();

// Endpoint untuk admin mengelola laporan
router.get('/report', getAllReports);

// Endpoint untuk admin melihat detail laporan
router.get('/report/:id', getReportById);

// Endpoint untuk admin memperbarui status laporan
router.patch('/report/:id/status', updateStatusReport);

// Endpoint untuk admin melihat profilnya
router.get('/profile', getAdminProfile);

// Endpoint untuk admin memperbarui profilnya
router.patch('/profile', updateAdminProfile);

// Endpoint untuk mendapatkan signed URL untuk upload foto profil
router.post(
  '/profile-picture/upload-url',
  createSignedUrlHandler('profile_pictures', profilePictureUploadSchema),
);

// Endpoint untuk mengubah foto profil admin saat ini
router.patch('/profile-picture', changeProfilePictureHandler(admin, 'Admin'));

export default router;
