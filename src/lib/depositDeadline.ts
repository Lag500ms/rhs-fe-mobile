/**
 * Helper đồng bộ hạn Đợt 1 (cọc) — BE installment DueDays=7 / DEPOSIT_PAYMENT_HOURS≈168h.
 * Mốc: khi vào DEPOSIT_PENDING (trúng / cấp nhà), không phải sau khi ký HĐ.
 */
export const DEPOSIT_PAYMENT_HOURS = 168;
export const DEPOSIT_PAYMENT_DAYS = 7;

/** @param startedAt Mốc vào DEPOSIT_PENDING (updatedAt / created installment). */
export function getDepositDeadline(startedAt: string | Date): Date {
  const d =
    typeof startedAt === 'string'
      ? new Date(startedAt)
      : new Date(startedAt.getTime());
  d.setTime(d.getTime() + DEPOSIT_PAYMENT_HOURS * 60 * 60 * 1000);
  return d;
}

export function getDepositRemainingMs(
  startedAt: string,
  nowMs = Date.now(),
): number {
  return getDepositDeadline(startedAt).getTime() - nowMs;
}

export function formatDepositHhmmss(remainingMs: number): string {
  const abs = Math.max(0, remainingMs);
  const totalHours = Math.floor(abs / 3600000);
  const days = Math.floor(totalHours / 24);
  const h = totalHours % 24;
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);
  if (days > 0) {
    return `${days} ngày ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function isPaymentSuccessStatus(status?: string | null): boolean {
  const s = String(status || '').toLowerCase();
  return s === 'success' || s === 'paid';
}
