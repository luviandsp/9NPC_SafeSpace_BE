import { z } from 'zod';

export const createReportSchema = z.object({
  incident: z.string().min(1, 'Insiden harus diisi').trim(),
  date: z.coerce.date('Format tanggal tidak valid'),
  location: z.string().min(1, 'Lokasi harus diisi').trim(),
  incidentDesc: z.string().min(1, 'Deskripsi insiden harus diisi').trim(),
  perpetratorDesc: z
    .string()
    .min(1, 'Deskripsi perpetrator harus diisi')
    .trim(),
  evidencePaths: z
    .array(z.string().min(1, 'Path bukti harus diisi'))
    .optional(),
});

export const evidenceUploadSchema = z.object({
  fileName: z.string().min(1, 'Nama file harus diisi').trim(),
  fileType: z.enum(
    [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
      'video/mp4',
      'video/mkv',
    ],
    {
      message: 'Tipe file tidak didukung',
    },
  ),
  fileSize: z.number().max(50 * 1024 * 1024, 'Ukuran file maksimal 50MB'),
});

export const getReportByIdSchema = z.object({
  id: z.uuid('ID harus berupa UUID valid').min(1, 'ID harus diisi').trim(),
});

export const getAllReportsSchema = z.object({
  page: z.coerce
    .number('Halaman harus berupa angka')
    .min(1, 'Halaman harus lebih besar dari 0')
    .default(1),
  limit: z.coerce
    .number('Limit harus berupa angka')
    .min(1, 'Limit harus lebih besar dari 0')
    .max(100, 'Limit maksimal adalah 100')
    .default(10),
});

export const updateStatusReportSchema = z.object({
  id: z.uuid('ID harus berupa UUID valid').min(1, 'ID harus diisi').trim(),
  status: z.enum(
    [
      'RECEIVED',
      'PROCESS',
      'REVIEW',
      'ASSISTANCE',
      'REJECTED',
      'DONE',
      'CANCELLED',
    ],
    {
      message: 'Status tidak valid',
    },
  ),
});
