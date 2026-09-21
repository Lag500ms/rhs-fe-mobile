import { isPaymentSuccessStatus } from '../../../lib/depositDeadline';

/** Đợt 1 (cọc) chỉ tính đã trả khi có giao dịch VNPay Success/Paid. */
export function isDepositPaymentSettled(paymentStatus?: string | null): boolean {
  return isPaymentSuccessStatus(paymentStatus);
}

export function isPhase1PaidByStatus(status?: string | null): boolean {
  const s = String(status || '').toUpperCase();
  return s === 'DEPOSIT_PAID' || s === 'INSTALLMENT_IN_PROGRESS' || s === 'FULLY_PAID';
}

export function isContractSignedForInstallments(status?: string | null): boolean {
  const s = String(status || '').toUpperCase();
  return s === 'CONTRACT_SIGNED' || s === 'INSTALLMENT_IN_PROGRESS' || s === 'FULLY_PAID';
}

/** Ký HĐMB khi đã cấp căn, chưa ký. Đợt 1 nộp sau khi ký. */
export function canSignSaleContract(opts: {
  applicationStatus: string;
  hasApartment: boolean;
  isSigned?: boolean | null;
}): boolean {
  if (!opts.hasApartment) return false;
  if (opts.isSigned || isContractSignedForInstallments(opts.applicationStatus)) return false;
  const status = String(opts.applicationStatus || '').toUpperCase();
  return (
    status === 'CONTRACT_PENDING' ||
    status === 'DEPOSIT_PENDING' ||
    status === 'DEPOSIT_PAID' ||
    status === 'CONTRACTING' ||
    status === 'APPROVED' ||
    status === 'APPROVED_BY_TIMEOUT' ||
    status === 'LOTTERY_WON'
  );
}

export function canPayPhase1(opts: {
  applicationStatus: string;
  isSigned?: boolean | null;
  phase1Paid: boolean;
}): boolean {
  if (opts.phase1Paid) return false;
  return opts.isSigned === true || isContractSignedForInstallments(opts.applicationStatus);
}

/** @deprecated Dùng canSignSaleContract. */
export function canSignAfterDeposit(opts: {
  applicationStatus: string;
  hasApartment: boolean;
  depositPaid?: boolean;
  isSigned?: boolean | null;
}): boolean {
  return canSignSaleContract(opts);
}

/** @deprecated Không còn chặn ký vì chưa đóng Đợt 1. */
export function needsDepositBeforeContract(_opts: {
  applicationStatus: string;
  hasApartment: boolean;
  depositPaid: boolean;
}): boolean {
  return false;
}
