import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

export const cleanupTempStorage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  console.log(
    'Menjalankan Cron Job Endpoint: Membersihkan folder temp di Storage...',
  );

  const bucketsToClean = ['evidence_assets', 'profile_pictures'];
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // Hapus file yang berusia lebih dari 24 jam

  let totalDeleted = 0;
  const details: Record<string, number> = {};

  try {
    for (const bucket of bucketsToClean) {
      console.log(`Memeriksa bucket: ${bucket}...`);
      let bucketDeletedCount = 0;

      // 1. Ambil daftar folder (ID User) di dalam 'temp'
      const { data: userFolders, error: folderError } =
        await supabaseAdmin.storage.from(bucket).list('temp');

      if (folderError) {
        console.error(
          `Gagal mengambil folder list dari ${bucket}:`,
          folderError,
        );
        details[bucket] = 0;
        continue;
      }

      if (!userFolders || userFolders.length === 0) {
        details[bucket] = 0;
        continue;
      }

      // 2. Loop melalui setiap folder ID User (contoh: temp/uuid-user-123)
      for (const folder of userFolders) {
        if (folder.name === '.emptyFolderPlaceholder') continue;

        const folderPath = `temp/${folder.name}`;

        // 3. Ambil daftar file di dalam folder ID User tersebut
        const { data: files, error: fileError } = await supabaseAdmin.storage
          .from(bucket)
          .list(folderPath);

        if (fileError || !files || files.length === 0) continue;

        // 4. Filter file yang usianya lebih dari 24 jam
        const filesToDelete = files
          .filter((file) => {
            if (file.name === '.emptyFolderPlaceholder') return false;
            if (!file.created_at) return false;

            const fileDate = new Date(file.created_at);
            return fileDate < twentyFourHoursAgo;
          })
          .map((file) => `${folderPath}/${file.name}`); // Path lengkap: temp/userId/fileName

        // 5. Hapus file jika ada
        if (filesToDelete.length > 0) {
          const { error: deleteError } = await supabaseAdmin.storage
            .from(bucket)
            .remove(filesToDelete);

          if (deleteError) {
            console.error(
              `Gagal menghapus file di ${folderPath}:`,
              deleteError,
            );
            continue;
          }

          bucketDeletedCount += filesToDelete.length;
          totalDeleted += filesToDelete.length;
        }
      }

      details[bucket] = bucketDeletedCount;
      console.log(
        `Selesai di ${bucket}. Menghapus ${bucketDeletedCount} file.`,
      );
    }

    return res.status(200).json({
      success: true,
      message: `Proses cleanup selesai. Total ${totalDeleted} file dihapus.`,
      details: details,
    });
  } catch (error) {
    console.error('Gagal menjalankan Cron Job Cleanup:', error);
    next(error);
  }
};
