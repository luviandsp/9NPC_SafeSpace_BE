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
  try {
    // 1. Ambil ID dan Role dari JWT Session
    const requesterId = req.user!.id;
    const isAdmin = req.user!.user_metadata?.role === 'ADMIN';

    // 2. Tentukan kolom mana yang akan dicari berdasarkan role
    const whereCondition = isAdmin
      ? eq(preference.adminId, requesterId)
      : eq(preference.userId, requesterId);

    // 3. Lakukan pencarian
    let settings = await db.query.preference.findFirst({
      where: whereCondition,
    });

    // 4. Jika tidak ada, jalankan Auto-Provisioning (Insert)
    if (!settings) {
      const insertPayload = isAdmin
        ? { adminId: requesterId }
        : { userId: requesterId };

      [settings] = await db
        .insert(preference)
        .values(insertPayload)
        .returning();
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
  try {
    // 1. Ambil ID dan Role dari JWT Session
    const requesterId = req.user!.id;
    const isAdmin = req.user!.user_metadata?.role === 'ADMIN';

    const body = updateSettingsSchema.parse(req.body);

    // 2. Tentukan kondisi pencarian berdasarkan role
    const whereCondition = isAdmin
      ? eq(preference.adminId, requesterId)
      : eq(preference.userId, requesterId);

    // 3. Cek eksistensi data
    let existing = await db.query.preference.findFirst({
      where: whereCondition,
    });

    // 4. Jika belum ada, lakukan Insert (Auto-Provisioning) terlebih dahulu
    if (!existing) {
      const insertPayload = isAdmin
        ? { adminId: requesterId }
        : { userId: requesterId };

      [existing] = await db
        .insert(preference)
        .values(insertPayload)
        .returning();
    }

    // 5. Update data
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
