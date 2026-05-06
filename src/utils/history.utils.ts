import { db } from '../db/index.js';
import { reportStatusHistory } from '../db/schema.js';

type StatusValue =
  | 'RECEIVED'
  | 'PROCESS'
  | 'REVIEW'
  | 'ASSISTANCE'
  | 'REJECTED'
  | 'DONE'
  | 'CANCELLED';

interface RecordStatusHistoryParams {
  reportId: string;
  oldStatus: StatusValue | null;
  newStatus: StatusValue;
  changedBy: string | null;
  changedByRole: 'USER' | 'ADMIN' | 'SYSTEM';
  notes?: string;
}

export async function recordStatusHistory(
  params: RecordStatusHistoryParams,
): Promise<void> {
  try {
    await db.insert(reportStatusHistory).values({
      reportId: params.reportId,
      oldStatus: params.oldStatus ?? undefined,
      newStatus: params.newStatus,
      changedBy: params.changedBy ?? undefined,
      changedByRole: params.changedByRole,
      notes: params.notes ?? undefined,
    });
  } catch (error) {
    console.error('Gagal mencatat riwayat status laporan:', error);
  }
}
