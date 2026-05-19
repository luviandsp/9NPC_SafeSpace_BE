export const CATEGORY_LABELS: Record<string, string> = {
  KEKERASAN_SEKSUAL: 'Kekerasan Seksual',
  KEKERASAN_VERBAL: 'Kekerasan Verbal',
  KEKERASAN_FISIK: 'Kekerasan Fisik',
  LAINNYA: 'Lainnya',
};

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Laporan Diterima',
  REVIEW: 'Sedang Direview',
  PROCESS: 'Sedang Diproses',
  REJECTED: 'Laporan Ditolak',
  ASSISTANCE: 'Pendampingan',
  DONE: 'Selesai Ditindaklanjuti',
  CANCELLED: 'Dibatalkan',
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
