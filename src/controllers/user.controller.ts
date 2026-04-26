import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import { user } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { updateUserProfileSchema } from '../utils/validators/user.validator.js';

export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user!.id;

  try {
    const data = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profil pengguna berhasil diambil',
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user!.id;
  const { name, phoneNumber, nim, department, faculty, enrollmentYear } =
    updateUserProfileSchema.parse(req.body);

  try {
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan',
      });
    }

    const updatedUser = await db
      .update(user)
      .set({
        name,
        phoneNumber,
        nim,
        department,
        faculty,
        enrollmentYear,
      })
      .where(eq(user.id, userId))
      .returning();

    return res.status(200).json({
      success: true,
      message: 'Profil pengguna berhasil diperbarui',
      data: updatedUser[0],
    });
  } catch (error) {
    next(error);
  }
};
