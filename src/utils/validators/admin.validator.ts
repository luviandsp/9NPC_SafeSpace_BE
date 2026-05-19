import { z } from 'zod';
import { reportCategorySchema } from './report.validator.js';

export const updateAdminProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama harus memiliki minimal 2 karakter')
    .max(50, 'Nama harus memiliki maksimal 50 karakter')
    .trim(),
  unit: z
    .string()
    .min(2, 'Unit harus memiliki minimal 2 karakter')
    .max(100, 'Unit harus memiliki maksimal 100 karakter')
    .trim(),
});

export const getRecentReportsSchema = z.object({
  limit: z.coerce
    .number('Limit harus berupa angka')
    .min(1, 'Limit harus lebih besar dari 0')
    .max(20, 'Limit maksimal adalah 20')
    .default(6),
});

export const getAdminReportsSchema = z.object({
  page: z.coerce
    .number('Halaman harus berupa angka')
    .min(1, 'Halaman harus lebih besar dari 0')
    .default(1),
  limit: z.coerce
    .number('Limit harus berupa angka')
    .min(1, 'Limit harus lebih besar dari 0')
    .max(100, 'Limit maksimal adalah 100')
    .default(10),
  search: z.string().trim().optional(),
  status: z
    .enum(
      [
        'RECEIVED',
        'PROCESS',
        'REVIEW',
        'ASSISTANCE',
        'REJECTED',
        'DONE',
        'CANCELLED',
      ],
      { message: 'Status tidak valid' },
    )
    .optional(),
  category: reportCategorySchema.optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const updateStatusBodySchema = z.object({
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
    { message: 'Status tidak valid' },
  ),
  internalNote: z.string().trim().optional(),
});
