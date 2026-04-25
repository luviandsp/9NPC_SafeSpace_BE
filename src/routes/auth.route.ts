import { Router } from 'express';
import {
  getCurrentUser,
  getCurrentSession,
  signIn,
  signOut,
  signUp,
  updatePasswordUser,
} from '../controllers/auth.controller';

const router = Router();

// Endpoint untuk registrasi (sign-up)
router.post('/sign-up', signUp);

// Endpoint untuk login (sign-in)
router.post('/sign-in', signIn);

// Endpoint untuk logout (sign-out)
router.post('/sign-out', signOut);

// Endpoint untuk mendapatkan informasi pengguna saat ini
router.get('/get-user', getCurrentUser);

// Endpoint untuk mendapatkan informasi sesi saat ini
router.get('/get-session', getCurrentSession);

// Endpoint untuk memperbarui password pengguna
router.post('/update-password', updatePasswordUser);

export default router;
