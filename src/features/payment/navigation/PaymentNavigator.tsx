/** Payment-related navigation parameter types for use in application stack */
export type PaymentStackParamList = {
  PaymentWebView: {
    paymentUrl: string
    orderId: string
    applicationId: string
    projectName?: string
    amount?: number
    /** Ví dụ: "Đợt 1", "Đợt 2: Trả trước…" */
    phaseLabel?: string
  }
  PaymentProcessing: {
    orderId: string
    applicationId: string
    projectName: string
    depositAmount: number
    phaseLabel?: string
  }
  PaymentSuccess: {
    orderId: string
    applicationId: string
    slotCode: string
    pdfUrl: string
    projectName: string
    applicantName: string
    amount: number
    paidAt?: string
    phaseLabel?: string
  }
}
