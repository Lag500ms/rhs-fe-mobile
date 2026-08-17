import { isPaymentSuccessStatus } from '../../../lib/depositDeadline';

/** Đợt 1 (cọc) chỉ tính đã trả khi có giao dịch VNPay Success/Paid. */
export function isDepositPaymentSettled(paymentStatus?: string | null): boolean {
  return isPaymentSuccessStatus(paymentStatus);
}

/**
 * Sau cấp nhà BE thường để CONTRACT_PENDING (chưa cọc).
 * Chỉ bắt đóng cọc khi đã có căn (để có giá Đợt 1).
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

/** Ký HĐ mua bán: đã cấp căn + đã cọc Đợt 1 + đang CONTRACT_PENDING. */
export function canSignAfterDeposit(opts: {
  applicationStatus: string;
  hasApartment: boolean;
  depositPaid: boolean;
}): boolean {
  const status = String(opts.applicationStatus || '').toUpperCase();
  return status === 'CONTRACT_PENDING' && opts.hasApartment && opts.depositPaid;
}

export function isContractSignedForInstallments(status?: string | null): boolean {
  const s = String(status || '').toUpperCase();
  return s === 'CONTRACT_SIGNED' || s === 'INSTALLMENT_IN_PROGRESS' || s === 'FULLY_PAID';
}
