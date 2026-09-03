export interface CreatePaymentRequest {
  applicationId: string;
  orderInfo?: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  message: string;
  data: {
    paymentUrl: string;
    orderId: string;
    amount: number;
  };
}

export interface DepositPaymentResult {
  orderId: string;
  applicationId: string;
  amount: number;
  slotCode: string;
  pdfUrl: string;
  vnpTransactionNo?: string;
  paidAt?: string;
  projectName: string;
  applicantName: string;
}

export interface PaymentInfo {
  id: string;
  orderId: string;
  orderInfo?: string;
  applicationId?: string | null;
  amount: number;
  status: string;
  vnpResponseCode?: string;
  vnpTransactionNo?: string;
  vnpBankCode?: string;
  vnpPayDate?: string;
  createdAt: string;
  paidAt?: string;
  slotCode?: string;
  pdfUrl?: string;
}

export interface DepositResultResponse {
  success: boolean;
  data: DepositPaymentResult;
}

export interface PaymentInfoResponse {
  success: boolean;
  data: PaymentInfo;
}

export interface MyPaymentsResponse {
  success: boolean;
  data: PaymentInfo[];
}

export interface InstallmentPhase {
  id: string;
  phaseOrder: number;
  phaseName: string;
  amount: number;
  startDate: string;
  dueDate: string;
  status: string;
  paidAt?: string | null;
  remainingDays: number;
  overdueDays?: number;
  dailyPenaltyRate?: number;
  penaltyAmount?: number;
  totalPayableAmount?: number;
  note?: string | null;
}

export interface InstallmentSummary {
  applicationId: string;
  apartmentTypeName?: string | null;
  apartmentArea?: number | null;
  apartmentPrice?: number | null;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  totalPenalty?: number;
  totalAmountWithPenalty?: number;
  totalPhases: number;
  paidPhases: number;
  phases: InstallmentPhase[];
}

export interface ContractCancellationPreview {
  applicationId: string;
  applicantName: string;
  apartmentUnitName?: string | null;
  apartmentPrice?: number | null;
  currentApplicationStatus: string;
  canCancel: boolean;
  message?: string | null;
  overduePhasesCount: number;
  isEligibleForForcedRevocation: boolean;
  phase1Amount: number;
  phase1PaidAmount: number;
  depositForfeited: number;
  phase2PlusPaidAmount: number;
  totalUnpaidPenalty: number;
  refundAmount: number;
  promotedWaitlistApplicantName?: string | null;
}

export interface CancelContractRequest {
  reason: string;
  isForcedRevocation?: boolean;
  bankAccountNumber?: string;
  bankName?: string;
  accountHolderName?: string;
}

export interface ContractCancellationResult {
  success: boolean;
  message: string;
  applicationId: string;
  isForcedRevocation?: boolean;
  depositForfeited: number;
  refundAmount: number;
  totalPenaltyDeducted?: number;
}

export interface InstallmentSummaryResponse {
  success: boolean;
  data: InstallmentSummary;
  message?: string;
}

export interface InstallmentPayResponse {
  success: boolean;
  message: string;
  data?: {
    paymentUrl: string;
    orderId: string;
    amount: number;
  };
}
