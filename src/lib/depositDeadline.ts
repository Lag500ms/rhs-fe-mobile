/**
 * Helper đồng bộ hạn Đợt 1 — mặc định BE là DEPOSIT_PAYMENT_HOURS≈168h (7 ngày),
 * tính từ khi vào DEPOSIT_PENDING (trúng / cấp nhà), không phải sau khi ký HĐ.
 *
 * QUAN TRỌNG: người được đôn từ Danh sách dự bị chỉ có WAITLIST_CONFIRM_HOURS (mặc định 48h),
 * ngắn hơn nhiều. Vì vậy luôn ưu tiên `depositDeadline` do BE trả về; con số 168h dưới đây chỉ là
 * phương án dự phòng khi BE chưa trả hạn, nếu tự cộng 168h cho mọi trường hợp thì người dự bị sẽ
 * thấy còn 7 ngày trong khi hệ thống thu hồi suất sau 48 giờ.
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

/**
 * Thời gian còn lại của Đợt 1.
 * @param startedAt Mốc vào DEPOSIT_PENDING, chỉ dùng khi không có hạn từ BE.
 * @param deadlineFromBe `depositDeadline` do BE trả về — nguồn quyết định.
 */
export function getDepositRemainingMs(
  startedAt: string,
  nowMs = Date.now(),
  deadlineFromBe?: string | null,
): number {
  if (deadlineFromBe) {
    const parsed = new Date(deadlineFromBe).getTime();
    if (!Number.isNaN(parsed)) return parsed - nowMs;
  }
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
