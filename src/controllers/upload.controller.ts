import { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';
import supabase from '../config/supabase.js';
import { ZodObject } from 'zod';
import { updateProfilePictureSchema } from '../utils/validators/user.validator.js';
import { db } from '../db/index.js';
import { eq } from 'drizzle-orm';

/**
 * Factory function untuk menghasilkan controller pembuat Signed URL
 * @param bucketName Nama bucket di Supabase
 * @param validationSchema Skema Zod untuk memvalidasi req.body
 */
export const createSignedUrlHandler = (
  bucketName: 'evidence_assets' | 'profile_pictures', // Batasi pilihan agar aman (Type-Safe)
  validationSchema: ZodObject<any>,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Validasi dinamis menggunakan skema yang dilempar dari parameter
      const { fileName } = validationSchema.parse(req.body) as {
        fileName: string;
      };
      const userId = req.user!.id;

      const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-]/g, '_');
      const path = `temp/${userId}/${nanoid(8)}-${safeFileName}`;

      // 2. Gunakan nama bucket yang dilempar dari parameter
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUploadUrl(path);

      if (error) {
        return next(error);
      }

      return res.status(200).json({
        success: true,
        message: `Presigned URL untuk ${bucketName} berhasil dibuat`,
        data: {
          uploadUrl: data.signedUrl,
          path: data.path,
          token: data.token,
        },
      });
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Factory function untuk mengubah foto profil secara dinamis
 * @param tableSchema Objek skema tabel Drizzle (user atau admin)
 * @param roleName String untuk pesan error (misal: 'Pengguna' atau 'Admin')
 */
export const changeProfilePictureHandler = (
  tableSchema: any,
  roleName: string,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { profilePicturePath } = updateProfilePictureSchema.parse(req.body);

    try {
      const [existingRecord] = await db
        .select()
        .from(tableSchema)
        .where(eq(tableSchema.id, userId))
        .limit(1);

      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          message: `${roleName} tidak ditemukan`,
        });
      }

      if (existingRecord.profilePicturePath) {
        const { error: deleteError } = await supabase.storage
          .from('profile_pictures')
          .remove([existingRecord.profilePicturePath]);

        if (deleteError) {
          console.error(
            `Gagal menghapus foto profil lama ${roleName}:`,
            deleteError,
          );
        }
      }

      const fileName = profilePicturePath.split('/').pop();
      const permanentPath = `permanent/${userId}/${fileName}`;

      const { error: moveError } = await supabase.storage
        .from('profile_pictures')
        .move(profilePicturePath, permanentPath);

      if (moveError) {
        return next(moveError);
      }

      const [updatedRecord] = await db
        .update(tableSchema)
        .set({ profilePicturePath: permanentPath })
        .where(eq(tableSchema.id, userId))
        .returning();

      return res.status(200).json({
        success: true,
        message: `Foto profil ${roleName.toLowerCase()} berhasil diperbarui`,
        data: updatedRecord,
      });
    } catch (error) {
      next(error);
    }
  };
};
