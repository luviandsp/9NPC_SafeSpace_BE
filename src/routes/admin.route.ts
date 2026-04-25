import { Router } from 'express';
import {
  getAllReports,
  getReportById,
  updateStatusReport,
} from '../controllers/admin.controller.js';

const router = Router();

router.get('/report', getAllReports);
router.get('/report/:id', getReportById);
router.patch('/report/:id/status', updateStatusReport);

export default router;
