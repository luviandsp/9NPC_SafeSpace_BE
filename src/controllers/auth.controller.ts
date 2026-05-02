import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import {
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
  try {
    const { error } = await supabase.auth.signOut();

    if (error) return next(error);

    return res.status(200).json({ success: true, message: 'Logout berhasil' });
  } catch (error) {
    next(error);
  }
};

// export const getCurrentUser = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const {
//       data: { user },
//       error,
//     } = await supabase.auth.getUser();

//     if (error) return next(error);

//     if (!user) {
//       return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Pengguna ditemukan',
//       data: user,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const getCurrentSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) return next(error);

    if (!session) {
      return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    }

    return res.status(200).json({
      success: true,
      message: 'Sesi ditemukan',
      data: session,
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
  const { currentPassword, newPassword, confirmPassword } =
    updatePasswordSchema.parse(req.body);

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
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
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) return next(error);

    return res.status(200).json({
      success: true,
      message: 'Email reset password telah dikirim. Silakan cek inbox Anda.',
    });
  } catch (error) {
    next(error);
  }
};
