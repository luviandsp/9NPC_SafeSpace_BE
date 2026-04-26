import { Router } from 'express';
import {
  createReport,
  getAllReports,
  getReportById,
  cancelReport,
} from '../controllers/report.controller.js';
import { createSignedUrlHandler } from '../controllers/upload.controller.js';
import { evidenceUploadSchema } from '../utils/validators/report.validator.js';

const router = Router();

// Endpoint untuk membuat laporan baru
router.post('/create', createReport);

// Endpoint untuk mendapatkan signed URL untuk upload bukti
router.post(
  '/evidence/upload-url',
  createSignedUrlHandler('evidence_assets', evidenceUploadSchema),
);

// Endpoint untuk mendapatkan detail laporan berdasarkan ID
router.get('/:id', getReportById);

// Endpoint untuk mendapatkan semua laporan yang dibuat oleh pengguna saat ini
router.get('/', getAllReports);

// Endpoint untuk membatalkan laporan
router.post('/:id', cancelReport);

export default router;
