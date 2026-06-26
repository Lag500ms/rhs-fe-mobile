/** Payment-related navigation parameter types for use in application stack */
export type PaymentStackParamList = {
  PaymentWebView: { paymentUrl: string; orderId: string; applicationId: string };
  PaymentProcessing: {
    orderId: string;
    applicationId: string;
    projectName: string;
    depositAmount: number;
  };
  PaymentSuccess: {
    orderId: string;
    slotCode: string;
    pdfUrl: string;
    projectName: string;
    applicantName: string;
    amount: number;
    paidAt?: string;
  };
};