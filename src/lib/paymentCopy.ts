/**
 * Khớp CAP/FE `lib/constants.ts`.
 * Đ25.1 Luật KDBĐS 2023: lần thanh toán đầu ≤ 30% HĐ, đã gồm tiền đặt cọc.
 * Đặt cọc riêng ≤ 5% (Đ23.5) — không gọi cả Đợt 1 là "tiền cọc".
 */
export const PHASE1_LABEL = 'Đợt 1 — thanh toán lần đầu (gồm tiền đặt cọc)';
export const PHASE1_LEGAL_NOTE =
  'Thanh toán lần đầu không quá 30% giá trị hợp đồng, bao gồm cả tiền đặt cọc (Đ25.1 Luật Kinh doanh bất động sản 2023).';
export const PHASE1_SHORT = 'Đợt 1';
export const PHASE1_PAY_CTA = 'Đóng Đợt 1';
export const PHASE1_CONTINUE_CTA = 'Tiếp tục Đợt 1';
