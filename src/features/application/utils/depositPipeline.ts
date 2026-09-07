import { isPaymentSuccessStatus } from '../../../lib/depositDeadline';

/** Đợt 1 (cọc) chỉ tính đã trả khi có giao dịch VNPay Success/Paid. */
export function isDepositPaymentSettled(paymentStatus?: string | null): boolean {
  return isPaymentSuccessStatus(paymentStatus);
}

/**
 * Sau cấp nhà BE để DEPOSIT_PENDING (đã có căn).
 * LOTTERY_WON = trúng suất chưa có căn → chưa đóng cọc.
 * CONTRACT_PENDING còn gặp ở dữ liệu cũ khi chưa cọc.
 */
export function needsDepositBeforeContract(opts: {
  applicationStatus: string;
  hasApartment: boolean;
  depositPaid: boolean;
}): boolean {
  if (opts.depositPaid) return false;
  const status = String(opts.applicationStatus || '').toUpperCase();
  if (status === 'DEPOSIT_PENDING') return true;
  return status === 'CONTRACT_PENDING' && opts.hasApartment;
}

/** Ký HĐ mua bán: đã cấp căn + đã cọc Đợt 1. */
export function canSignAfterDeposit(opts: {
  applicationStatus: string;
  hasApartment: boolean;
  depositPaid: boolean;
}): boolean {
  if (!opts.hasApartment || !opts.depositPaid) return false;
  const status = String(opts.applicationStatus || '').toUpperCase();
  return (
    status === 'CONTRACT_PENDING' ||
    status === 'DEPOSIT_PENDING' ||
    status === 'DEPOSIT_PAID' ||
    status === 'CONTRACTING'
  );
}

export function isContractSignedForInstallments(status?: string | null): boolean {
  const s = String(status || '').toUpperCase();
  return s === 'CONTRACT_SIGNED' || s === 'INSTALLMENT_IN_PROGRESS' || s === 'FULLY_PAID';
}
