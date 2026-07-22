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

type LookupDocItem = { code: string; label: string };

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
   * GET /api/lookup/document-types/required?priorityGroup=...
   */
  getRequiredDocuments: async (
    applicationId: string,
  ): Promise<RequiredDocumentsResponse> => {
    const detail = await housingApplicationApi.getApplicationDetail(applicationId);
    const priorityGroup = detail.priorityGroup || undefined;
    const response = await apiClient.get<LookupDocItem[]>(
      '/lookup/document-types/required',
      { params: priorityGroup ? { priorityGroup } : undefined },
    );
    const requiredDocuments: RequiredDocumentItem[] = (response.data || []).map((item) => ({
      documentType: item.code,
      label: item.label,
      subtitle: 'PDF, tối đa 10MB',
      isUploaded: (detail.documents || []).some((d) => d.documentType === item.code),
      documentId: (detail.documents || []).find((d) => d.documentType === item.code)?.documentId,
    }));
    return { priorityGroup: detail.priorityGroup, requiredDocuments };
  },

  /** Chỉ lấy checklist theo priorityGroup (khi đã có detail). */
  getRequiredDocumentsByPriorityGroup: async (
    priorityGroup: string | null | undefined,
  ): Promise<RequiredDocumentItem[]> => {
    const response = await apiClient.get<LookupDocItem[]>(
      '/lookup/document-types/required',
      { params: priorityGroup ? { priorityGroup } : undefined },
    );
    return (response.data || []).map((item) => ({
      documentType: item.code,
      label: item.label,
      subtitle: 'PDF, tối đa 10MB',
    }));
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
