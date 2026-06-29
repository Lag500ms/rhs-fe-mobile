import apiClient from '../../../lib/apiClient';

/** Request body for creating a payment URL */
export interface CreatePaymentRequest {
  applicationId: string;
  orderInfo?: string;
}

/** Response from create-payment-url endpoint */
export interface CreatePaymentResponse {
  success: boolean;
  message: string;
  data: {
    paymentUrl: string;
    orderId: string;
    amount: number;
  };
}

/** Deposit result after successful payment */
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

/** Payment transaction info */
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

/** Deposit result API response wrapper */
export interface DepositResultResponse {
  success: boolean;
  data: DepositPaymentResult;
}

/** Payment info API response wrapper */
export interface PaymentInfoResponse {
  success: boolean;
  data: PaymentInfo;
}

/** List payments response */
export interface MyPaymentsResponse {
  success: boolean;
  data: PaymentInfo[];
}

export const paymentApi = {
  /**
   * Proxy the VNPay server-to-server callback.
   * After detecting the VNPay redirect URL in the WebView, the mobile app
   * calls this method to pass the VNPay response query params to the backend,
   * since VNPay's IPN can't reach localhost in dev or a private network.
   * GET /api/Payment/payment-callback?{queryString}
   */
  processVnpayCallback: async (queryString: string): Promise<any> => {
    // dùng fetch() thay vì apiClient để tránh axios URL encoding làm hỏng
    // query string của VNPay (phá chữ ký HMAC-SHA512)
    const res = await fetch(`${apiClient.defaults.baseURL}/Payment/payment-callback?${queryString}`);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Callback failed: ${res.status} ${body}`);
    }
    return res.json();
  },

  /**
   * Tạo URL thanh toán đặt cọc cho hồ sơ đã APPROVED.
   * POST /api/Payment/create-payment-url
   */
  createPaymentUrl: async (
    applicationId: string,
    orderInfo?: string,
  ): Promise<CreatePaymentResponse> => {
    const payload: CreatePaymentRequest = {
      applicationId,
    };
    if (orderInfo) {
      payload.orderInfo = orderInfo;
    }
    const response = await apiClient.post<CreatePaymentResponse>(
      '/Payment/create-payment-url',
      payload,
    );
    return response.data;
  },

  /**
   * Tra cứu kết quả thanh toán đặt cọc theo orderId.
   * GET /api/Payment/deposit-result/{orderId}
   */
  getDepositResult: async (orderId: string): Promise<DepositResultResponse> => {
    const response = await apiClient.get<DepositResultResponse>(
      `/Payment/deposit-result/${orderId}`,
    );
    return response.data;
  },

  /**
   * Tra cứu thông tin chi tiết giao dịch.
   * GET /api/Payment/payment-info/{orderId}
   */
  getPaymentInfo: async (orderId: string): Promise<PaymentInfoResponse> => {
    const response = await apiClient.get<PaymentInfoResponse>(
      `/Payment/payment-info/${orderId}`,
    );
    return response.data;
  },

  /**
   * Lấy lịch sử giao dịch của người dùng.
   * GET /api/Payment/my-payments
   */
  getMyPayments: async (): Promise<MyPaymentsResponse> => {
    const response = await apiClient.get<MyPaymentsResponse>(
      '/Payment/my-payments',
    );
    return response.data;
  },
};