import { Router } from 'express';
import { cleanupTempStorage } from '../controllers/cron.controller.js';

const router = Router();

// Endpoint cron menggunakan method GET
router.get('/cleanup', cleanupTempStorage);

export default router;
