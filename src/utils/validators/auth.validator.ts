import { z } from 'zod';

export const signUpSchema = z
  .object({
    email: z.email('Email tidak valid').trim(),
    password: z
      .string()
      .min(8, 'Password harus memiliki minimal 8 karakter')
      .refine((value) => {
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

        return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
      }, 'Password harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus')
      .trim(),
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password dan konfirmasi password harus sama',
    path: ['confirmPassword'],
  });

export const signInSchema = z.object({
  email: z.email('Email tidak valid').trim(),
  password: z.string().trim(),
});

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().trim(),
    newPassword: z
      .string()
      .min(8, 'Password baru harus memiliki minimal 8 karakter')
      .refine((value) => {
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

        return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
      }, 'Password baru harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus')
      .trim(),
    confirmPassword: z
      .string()
      .min(8, 'Konfirmasi password harus memiliki minimal 8 karakter')
      .trim(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Password baru dan konfirmasi password harus sama',
    path: ['confirmPassword'],
  });

export const emailRequestSchema = z.object({
  email: z.email('Email tidak valid').trim(),
});
