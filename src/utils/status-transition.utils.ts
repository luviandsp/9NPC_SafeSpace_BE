type ReportStatus =
  | 'RECEIVED'
  | 'PROCESS'
  | 'REVIEW'
  | 'ASSISTANCE'
  | 'REJECTED'
  | 'DONE'
  | 'CANCELLED';

const ALLOWED_TRANSITIONS: Partial<Record<ReportStatus, ReportStatus[]>> = {
  RECEIVED: ['REVIEW'],
  REVIEW: ['REJECTED', 'PROCESS'],
  PROCESS: ['ASSISTANCE'],
  ASSISTANCE: ['DONE'],
  // REJECTED, DONE, CANCELLED are terminal — no entry means no transitions allowed
};

export function validateStatusTransition(
  from: ReportStatus,
  to: ReportStatus,
): { valid: boolean; message?: string } {
  if (from === to) {
    return { valid: false, message: 'Status tidak berubah' };
  }

  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    return {
      valid: false,
      message: `Transisi dari ${from} ke ${to} tidak diizinkan`,
    };
  }

  return { valid: true };
}
