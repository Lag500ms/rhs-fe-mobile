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
