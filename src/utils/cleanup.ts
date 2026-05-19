import cron from 'node-cron';
import { supabaseAdmin } from '../config/supabase.js';

// Menjalankan tugas setiap jam 00:00 (Tengah Malam)
cron.schedule('0 0 * * *', async () => {
  console.log('Menjalankan Cron Job: Membersihkan folder temp di Storage...');

  try {
    // 1. Ambil daftar file di dalam folder 'temp'
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('evidence_assets')
      .list('temp');

    if (listError) throw listError;
    if (!files || files.length === 0) return;

    // 2. Filter file yang usianya lebih dari 24 jam
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const filesToDelete = files
      .filter((file) => {
        // Abaikan folder kosongan / placeholder
        if (file.name === '.emptyFolderPlaceholder') return false;
        if (!file.created_at) return false;

        const fileDate = new Date(file.created_at);
        return fileDate < twentyFourHoursAgo;
      })
      .map((file) => `temp/${file.name}`); // Sesuaikan nama path

    // 3. Hapus file menggunakan Storage API
    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabaseAdmin.storage
        .from('evidence_assets')
        .remove(filesToDelete);

      if (deleteError) throw deleteError;
      console.log(
        `Berhasil menghapus ${filesToDelete.length} file temporary lama.`,
      );
    } else {
      console.log('Tidak ada file temporary lama yang perlu dihapus.');
    }
  } catch (error) {
    console.error('Gagal menjalankan Cron Job Cleanup:', error);
  }
});
