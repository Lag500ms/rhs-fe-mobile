/**
 * Fallback khớp default policy BE `DEPOSIT_PAYMENT_HOURS` (Applicant không đọc được Policy API).
 * deadline = finalDecisionDate + hours — không dùng ngày nộp/đăng ký.
 */
export const DEPOSIT_PAYMENT_HOURS = 24;

const APPROVED_FOR_DEPOSIT_DEADLINE = new Set(['APPROVED', 'APPROVED_BY_TIMEOUT']);

export function isDepositDeadlineStatus(status: string | null | undefined): boolean {
  return !!status && APPROVED_FOR_DEPOSIT_DEADLINE.has(status);
}

export function getDepositDeadline(finalDecisionDate: string | Date): Date {
  const d =
    typeof finalDecisionDate === 'string'
      ? new Date(finalDecisionDate)
      : new Date(finalDecisionDate.getTime());
  d.setTime(d.getTime() + DEPOSIT_PAYMENT_HOURS * 60 * 60 * 1000);
  return d;
}

export function getDepositRemainingMs(
  finalDecisionDate: string,
  nowMs = Date.now(),
): number {
  return getDepositDeadline(finalDecisionDate).getTime() - nowMs;
}

export function formatDepositHhmmss(remainingMs: number): string {
  const abs = Math.max(0, remainingMs);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
