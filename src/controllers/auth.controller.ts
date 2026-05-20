import { Request, Response, NextFunction } from 'express';
import { supabase, createScopedClient } from '../config/supabase.js';
import 'dotenv/config';
import {
  confirmPasswordResetSchema,
  emailRequestSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from '../utils/validators/auth.validator.js';

export const signUp = (role: 'USER' | 'ADMIN' = 'USER') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = signUpSchema.parse(req.body);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
          },
          emailRedirectTo: process.env.FRONTEND_URL_LOGIN,
        },
      });

      if (error) return next(error);

      return res.status(201).json({
        success: true,
        message:
          'Registrasi berhasil. Profil dasar telah dibuat. Silakan cek email Anda untuk verifikasi.',
        // Trigger di database akan menangani pembuatan profil di tabel 'user'
        data: data.user,
      });
    } catch (error) {
      next(error);
    }
  };
};

export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = signInSchema.parse(req.body);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return next(error);

    return res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: data.user,
        token: data.session?.access_token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const signOut = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: 'Token tidak valid' });

  const supabaseScoped = createScopedClient(token);

  try {
    const { error } = await supabaseScoped.auth.signOut();

    if (error) return next(error);

    return res.status(200).json({ success: true, message: 'Logout berhasil' });
  } catch (error) {
    next(error);
  }
};

export const getCurrentSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user;

    return res.status(200).json({
      success: true,
      message: 'Sesi (Pengguna) ditemukan',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePasswordUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);
  const token = req.headers.authorization?.split(' ')[1];
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: 'Token tidak valid' });

  const supabaseScoped = createScopedClient(token);

  try {
    const { data, error } = await supabaseScoped.auth.updateUser({
      password: newPassword,
      current_password: currentPassword,
    });

    if (error) return next(error);

    return res.status(200).json({
      success: true,
      message: 'Password berhasil diperbarui',
      data: data.user,
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email } = emailRequestSchema.parse(req.body);

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) return next(error);

    return res.status(200).json({
      success: true,
      message: 'Email verifikasi telah dikirim ulang. Silakan cek inbox Anda.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetEmailPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email } = emailRequestSchema.parse(req.body);

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.FRONTEND_URL_RESET_PASSWORD,
    });

    if (error) return next(error);

    return res.status(200).json({
      success: true,
      message: 'Email reset password telah dikirim. Silakan cek inbox Anda.',
    });
  } catch (error) {
    next(error);
  }
};

export const confirmPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { newPassword } = confirmPasswordResetSchema.parse(req.body);

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token pemulihan tidak valid atau tidak ditemukan',
    });
  }

  const supabaseScoped = createScopedClient(token);

  try {
    const { data, error } = await supabaseScoped.auth.updateUser({
      password: newPassword,
    });

    if (error) return next(error);

    return res.status(200).json({
      success: true,
      message:
        'Password berhasil direset. Silakan login menggunakan password baru.',
      data: data.user,
    });
  } catch (error) {
    next(error);
  }
};
