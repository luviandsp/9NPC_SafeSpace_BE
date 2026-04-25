import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password harus diisi' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return next(error);

    return res.status(201).json({
      message:
        'Registrasi berhasil. Profil dasar telah dibuat. Silakan cek email Anda untuk verifikasi.',
      // Trigger di database akan menangani pembuatan profil di tabel 'user'
      user: data.user,
    });
  } catch (error) {
    next(error);
  }
};

export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password harus diisi' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return next(error);

    return res.json({
      message: 'Login berhasil',
      user: data.user,
      token: data.session?.access_token,
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

    return res.json({ message: 'Logout berhasil' });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) return next(error);

    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    return res.json({ user });
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
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) return next(error);

    if (!session) {
      return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    }

    return res.json({ session });
  } catch (error) {
    next(error);
  }
};

export const updatePasswordUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password harus diisi' });
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) return next(error);

    return res.json({
      message: 'Password berhasil diperbarui',
      user: data.user,
    });
  } catch (error) {
    next(error);
  }
};
