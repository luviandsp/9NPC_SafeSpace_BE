import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import { preference } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { updateSettingsSchema } from '../utils/validators/settings.validator.js';

export const getSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user!.id;

  try {
    let settings = await db.query.preference.findFirst({
      where: eq(preference.userId, userId),
    });

    if (!settings) {
      [settings] = await db.insert(preference).values({ userId }).returning();
    }

    return res.status(200).json({
      success: true,
      message: 'Pengaturan notifikasi berhasil diambil',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user!.id;
  const body = updateSettingsSchema.parse(req.body);

  try {
    let existing = await db.query.preference.findFirst({
      where: eq(preference.userId, userId),
    });

    if (!existing) {
      [existing] = await db.insert(preference).values({ userId }).returning();
    }

    const [updated] = await db
      .update(preference)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(preference.id, existing.id))
      .returning();

    return res.status(200).json({
      success: true,
      message: 'Pengaturan notifikasi berhasil diperbarui',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
