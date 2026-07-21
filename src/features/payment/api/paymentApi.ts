import apiClient from '../../../lib/apiClient';
import * as FileSystem from 'expo-file-system/legacy';
import {
  CreatePaymentRequest,
  CreatePaymentResponse,
  DepositResultResponse,
  PaymentInfoResponse,
  MyPaymentsResponse,
  InstallmentSummary,
  InstallmentSummaryResponse,
  InstallmentPayResponse,
} from '../types/payment';

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

  /**
   * Tải PDF hợp đồng nguyên tắc (cần JWT).
   * GET /api/Payment/download-contract/{applicationId}
   */
  downloadContract: async (applicationId: string): Promise<ArrayBuffer> => {
    const response = await apiClient.get<ArrayBuffer>(
      `/Payment/download-contract/${applicationId}`,
      { responseType: 'arraybuffer' },
    );
    return response.data;
  },

  /**
   * Tải hợp đồng có auth và lưu file local, trả về file:// URI.
   */
  downloadContractToFile: async (applicationId: string): Promise<string> => {
    const buffer = await paymentApi.downloadContract(applicationId);
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = globalThis.btoa(binary);
    const fileUri = `${FileSystem.documentDirectory}hop_dong_${applicationId}.pdf`;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return fileUri;
  },

  /**
   * Lấy lịch đóng tiền theo đợt cho hồ sơ.
   * GET /api/Payment/installments/{applicationId}
   */
  getInstallments: async (applicationId: string): Promise<InstallmentSummary> => {
    const response = await apiClient.get<InstallmentSummaryResponse>(
      `/Payment/installments/${applicationId}`,
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Không lấy được lịch thanh toán.');
    }
    return response.data.data;
  },

  /**
   * Tạo URL VNPay cho một đợt thanh toán.
   * POST /api/Payment/installments/{installmentId}/pay
   */
  payInstallment: async (installmentId: string): Promise<InstallmentPayResponse> => {
    const response = await apiClient.post<InstallmentPayResponse>(
      `/Payment/installments/${installmentId}/pay`,
    );
    return response.data;
  },
};
