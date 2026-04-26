import { z } from 'zod';

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
