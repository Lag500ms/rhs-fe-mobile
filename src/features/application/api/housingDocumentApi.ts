import apiClient from '../../../lib/apiClient';
import {
  UploadDocumentResponse,
  VerificationResultResponse,
} from '../types/application';

export const housingDocumentApi = {
  /**
   * Upload tài liệu PDF vào hồ sơ.
   * POST /api/housing-applications/{applicationId}/documents
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
    );
    return response.data;
  },

  deleteDocument: async (applicationId: string, documentId: string): Promise<void> => {
    await apiClient.delete(`/housing-applications/${applicationId}/documents/${documentId}`);
  },

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
