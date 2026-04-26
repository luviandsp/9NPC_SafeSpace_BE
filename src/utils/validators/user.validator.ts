import { z } from 'zod';

const phoneRegex = new RegExp(/^(?:\+62|08)[1-9][0-9]{6,10}$/);
const nameRegex = new RegExp(/^[a-zA-Z\s]+$/);

export const updateUserProfileSchema = z.object({
  name: z
    .string()
    .regex(nameRegex, 'Nama hanya boleh mengandung huruf dan spasi')
    .min(2, 'Nama harus memiliki minimal 2 karakter')
    .max(50, 'Nama harus memiliki maksimal 50 karakter')
    .trim(),
  phoneNumber: z.string().regex(phoneRegex, 'Nomor telepon tidak valid').trim(),
  nim: z
    .string()
    .min(10, 'NIM harus memiliki minimal 10 karakter')
    .max(15, 'NIM harus memiliki maksimal 15 karakter')
    .trim(),
  department: z
    .string()
    .min(2, 'Jurusan harus memiliki minimal 2 karakter')
    .max(100, 'Jurusan harus memiliki maksimal 100 karakter')
    .trim(),
  faculty: z
    .string()
    .min(2, 'Fakultas harus memiliki minimal 2 karakter')
    .max(100, 'Fakultas harus memiliki maksimal 100 karakter')
    .trim(),
  enrollmentYear: z
    .number()
    .int()
    .min(2000, 'Tahun masuk harus valid')
    .max(new Date().getFullYear(), 'Tahun masuk tidak boleh di masa depan'),
});
