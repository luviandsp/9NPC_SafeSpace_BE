import { Router } from 'express';
import {
  createReport,
  getAllReports,
  generateUploadSignedUrl,
  getReportById,
  cancelReport,
} from '../controllers/report.controller';

const router = Router();

router.post('/create', createReport);

router.post('/upload-signed-url', generateUploadSignedUrl);

router.get('/:id', getReportById);

router.get('/', getAllReports);

router.post('/:id', cancelReport);

export default router;
