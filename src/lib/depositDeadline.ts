/**
 * Helper đồng bộ policy BE `DEPOSIT_PAYMENT_HOURS` (mặc định 168h = 7 ngày).
 * Mốc đúng: sau khi ký HĐ (`CONTRACT_SIGNED` / SignedAt) — không dùng trên `APPROVED`.
 */
export const DEPOSIT_PAYMENT_HOURS = 168;
export const DEPOSIT_PAYMENT_DAYS = 7;

const DEPOSIT_DEADLINE_STATUSES = new Set(['CONTRACT_SIGNED']);

export function isDepositDeadlineStatus(status: string | null | undefined): boolean {
  return !!status && DEPOSIT_DEADLINE_STATUSES.has(status);
}

/** @param signedAt Mốc ký HĐ — không dùng finalDecisionDate (ngày duyệt SXD). */
export function getDepositDeadline(signedAt: string | Date): Date {
  const d =
    typeof signedAt === 'string'
      ? new Date(signedAt)
      : new Date(signedAt.getTime());
  d.setTime(d.getTime() + DEPOSIT_PAYMENT_HOURS * 60 * 60 * 1000);
  return d;
}

export function getDepositRemainingMs(
  signedAt: string,
  nowMs = Date.now(),
): number {
  return getDepositDeadline(signedAt).getTime() - nowMs;
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
