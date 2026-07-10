import apiClient from '../../../lib/apiClient';
import {
  UploadDocumentResponse,
  VerificationResultResponse,
} from '../types/application';

export const housingDocumentApi = {
  /**
   * Upload tài liệu PDF vào hồ sơ.
   * POST /api/housing-applications/{applicationId}/documents
   *
   * @param applicationId - ID hồ sơ vừa tạo
   * @param documentType - "HOUSING_CONDITION_PROOF" hoặc "POVERTY_HOUSEHOLD_CERTIFICATE"
   * @param fileUri - URI của file PDF (từ DocumentPicker)
   */
  uploadDocument: async (
    applicationId: string,
    documentType: string,
    fileUri: string,
  ): Promise<UploadDocumentResponse> => {
    const fileName = fileUri.split('/').pop()?.split('?')[0] || 'document.pdf';

    const formData = new FormData();
    formData.append('DocumentType', documentType);
    formData.append('File', {
      uri: fileUri,
      name: fileName,
      type: 'application/pdf',
    } as any);

    const response = await apiClient.post<UploadDocumentResponse>(
      `/housing-applications/${applicationId}/documents`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  /**
   * Xóa tài liệu khỏi hồ sơ.
   * DELETE /api/housing-applications/{applicationId}/documents/{documentId}
   *
   * @param applicationId - ID hồ sơ
   * @param documentId - ID tài liệu cần xóa
   */
  deleteDocument: async (applicationId: string, documentId: string): Promise<void> => {
    await apiClient.delete(`/housing-applications/${applicationId}/documents/${documentId}`);
  },

  /**
   * Lấy kết quả xác minh AI của tài liệu.
   * GET /api/housing-applications/{applicationId}/documents/{documentId}/verification
   *
   * @param applicationId - ID hồ sơ
   * @param documentId - ID tài liệu
   */
  getVerificationResult: async (
    applicationId: string,
    documentId: string
  ): Promise<VerificationResultResponse> => {
    const response = await apiClient.get<VerificationResultResponse>(
      `/housing-applications/${applicationId}/documents/${documentId}/verification`
    );
    return response.data;
  },
};