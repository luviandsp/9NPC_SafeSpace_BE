import { z } from 'zod';

export const updateSettingsSchema = z.object({
  emailStatusUpdate: z.boolean().optional(),
  emailWeeklySummary: z.boolean().optional(),
  emailSecurityAlert: z.boolean().optional(),
  emailNewArticles: z.boolean().optional(),
  pushStatusUpdate: z.boolean().optional(),
  pushSecurityAlert: z.boolean().optional(),
});
