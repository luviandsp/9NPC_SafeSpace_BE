import { z } from 'zod';

export const listNotificationsSchema = z.object({
  page: z.coerce
    .number('Halaman harus berupa angka')
    .min(1, 'Halaman harus lebih besar dari 0')
    .default(1),
  limit: z.coerce
    .number('Limit harus berupa angka')
    .min(1, 'Limit harus lebih besar dari 0')
    .max(100, 'Limit maksimal adalah 100')
    .default(10),
  unread: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

export const notificationIdSchema = z.object({
  id: z.uuid('ID harus berupa UUID valid').min(1, 'ID harus diisi').trim(),
});
