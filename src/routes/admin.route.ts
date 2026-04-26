import { Router } from 'express';
import {
  getAdminProfile,
  getAllReports,
  getReportById,
  updateAdminProfile,
  updateStatusReport,
} from '../controllers/admin.controller.js';

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

export default router;
