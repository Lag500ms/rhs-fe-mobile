import { Platform } from 'react-native';
import apiClient from '../../../lib/apiClient';
import {
  UploadDocumentResponse,
  VerificationResultResponse,
} from '../types/application';

function pdfFileName(fileName?: string, fileUri?: string): string {
  let name = (fileName || fileUri?.split('/').pop()?.split('?')[0] || 'document.pdf').trim();
  if (!/\.pdf$/i.test(name)) name = `${name}.pdf`;
  return name;
}

function aspNetErrorMessage(data: any, fallback: string): string {
  if (!data) return fallback;
  if (typeof data.message === 'string' && data.message.trim()) return data.message;
  if (typeof data.title === 'string' && data.title.trim()) return data.title;
  const errors = data.errors;
  if (errors && typeof errors === 'object') {
    const parts = Object.values(errors)
      .flat()
      .filter((x): x is string => typeof x === 'string');
    if (parts.length) return parts.join('\n');
  }
  return fallback;
}

export const housingDocumentApi = {
  /**
   * Upload tài liệu PDF vào hồ sơ.
   * POST /api/housing-applications/{applicationId}/documents
   * Web phải gửi Blob/File; native dùng { uri, name, type }.
   */
  uploadDocument: async (
    applicationId: string,
    documentType: string,
    fileUri: string,
    fileName?: string,
    webFile?: File,
  ): Promise<UploadDocumentResponse> => {
    const name = pdfFileName(fileName, fileUri);
    const formData = new FormData();
    formData.append('DocumentType', documentType);

    if (Platform.OS === 'web') {
      const blob = webFile ?? (await fetch(fileUri).then((r) => r.blob()));
      formData.append('File', new File([blob], name, { type: 'application/pdf' }));
    } else {
      formData.append('File', {
        uri: fileUri,
        name,
        type: 'application/pdf',
      } as any);
    }

    try {
      const response = await apiClient.post<UploadDocumentResponse>(
        `/housing-applications/${applicationId}/documents`,
        formData,
        {
          headers: { Accept: 'application/json' },
          transformRequest: (data, headers) => {
            if (headers) {
              if (typeof (headers as any).delete === 'function') {
                (headers as any).delete('Content-Type');
              } else {
                delete (headers as any)['Content-Type'];
              }
            }
            return data;
          },
        },
      );
      return response.data;
    } catch (e: any) {
      const msg = aspNetErrorMessage(
        e?.response?.data,
        e?.message || 'Không thể upload tài liệu.',
      );
      const err = new Error(msg) as Error & { response?: any };
      err.response = e?.response;
      throw err;
    }
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
