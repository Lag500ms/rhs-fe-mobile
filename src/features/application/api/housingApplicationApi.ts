import apiClient from '../../../lib/apiClient';
import {
  CreateApplicationRequest,
  CreateApplicationResponse,
  UpdateApplicationRequest,
  ApplicationSummary,
  ApplicationDetail,
  PagedResponse,
  RequiredDocumentsResponse,
  RequiredDocumentItem,
} from '../types/application';
import { lookupApi } from './lookupApi';

export const housingApplicationApi = {
  createApplication: async (data: CreateApplicationRequest): Promise<CreateApplicationResponse> => {
    const response = await apiClient.post<CreateApplicationResponse>(
      '/housing-applications',
      data
    );
    return response.data;
  },

  updateApplication: async (
    applicationId: string,
    data: UpdateApplicationRequest,
  ): Promise<ApplicationDetail> => {
    const response = await apiClient.put<ApplicationDetail>(
      `/housing-applications/${applicationId}`,
      data,
    );
    return response.data;
  },

  submitApplication: async (applicationId: string): Promise<void> => {
    await apiClient.post(`/housing-applications/${applicationId}/submit`);
  },

  getMyApplications: async (): Promise<PagedResponse<ApplicationSummary>> => {
    const response = await apiClient.get<PagedResponse<ApplicationSummary>>(
      '/housing-applications/my'
    );
    return response.data;
  },

  getApplicationDetail: async (applicationId: string): Promise<ApplicationDetail> => {
    const response = await apiClient.get<ApplicationDetail>(
      `/housing-applications/${applicationId}`
    );
    return response.data;
  },

  /**
   * Giấy tờ bắt buộc theo PriorityGroup — dùng lookup BE.
   * Thiếu priorityGroup → throw MISSING_PRIORITY_GROUP.
   */
  getRequiredDocuments: async (
    applicationId: string,
  ): Promise<RequiredDocumentsResponse> => {
    const detail = await housingApplicationApi.getApplicationDetail(applicationId);
    const requiredDocuments = await lookupApi.getRequiredDocumentTypes(detail.priorityGroup);
    const withUpload: RequiredDocumentItem[] = requiredDocuments.map((item) => ({
      ...item,
      isUploaded: (detail.documents || []).some((d) => d.documentType === item.documentType),
      documentId: (detail.documents || []).find((d) => d.documentType === item.documentType)
        ?.documentId,
    }));
    return { priorityGroup: detail.priorityGroup, requiredDocuments: withUpload };
  },

  /** Chỉ lấy checklist theo priorityGroup (khi đã có detail). */
  getRequiredDocumentsByPriorityGroup: async (
    priorityGroup: string | null | undefined,
  ): Promise<RequiredDocumentItem[]> => {
    return lookupApi.getRequiredDocumentTypes(priorityGroup);
  },

  cancelApplication: async (
    applicationId: string,
    cancelReason: string,
  ): Promise<void> => {
    await apiClient.patch(`/housing-applications/${applicationId}/cancel`, {
      cancelReason,
    });
  },
};
