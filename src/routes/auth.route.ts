import { Router } from 'express';
import {
  getCurrentSession,
  signIn,
  signOut,
  signUp,
  updatePasswordUser,
  resendVerificationEmail,
  resetEmailPassword,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Endpoint untuk registrasi (sign-up)
router.post('/sign-up', signUp('USER'));

// Endpoint untuk registrasi admin
router.post('/admin/sign-up', signUp('ADMIN'));

// Endpoint untuk login (sign-in)
router.post('/sign-in', signIn);

// Endpoint untuk logout (sign-out)
router.post('/sign-out', requireAuth, signOut);

// Endpoint untuk mendapatkan informasi pengguna saat ini
// router.get('/get-user', getCurrentUser);

// Endpoint untuk mendapatkan informasi sesi saat ini
router.get('/get-session', getCurrentSession);

// Endpoint untuk memperbarui password pengguna
router.post('/update-password', requireAuth, updatePasswordUser);

// Endpoint untuk mengirim ulang email verifikasi
router.post('/resend-verification-email', resendVerificationEmail);

// Endpoint untuk request reset password
router.post('/request-password-reset', resetEmailPassword);

export default router;
