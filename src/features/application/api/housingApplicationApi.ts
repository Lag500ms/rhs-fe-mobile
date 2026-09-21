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

const DEAD_APPLICATION_STATUSES = new Set([
  'REJECTED',
  'CANCELED',
  'CANCELLED',
  'EXPIRED',
]);

function unwrapApplicationList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  const root = (data ?? {}) as Record<string, unknown>;
  const page = (root.data ?? root.Data ?? root) as Record<string, unknown>;
  const items = page.items ?? page.Items;
  return Array.isArray(items) ? (items as Record<string, unknown>[]) : [];
}

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
      '/housing-applications/my',
      { params: { pageIndex: 1, pageSize: 50 } },
    );
    const items = unwrapApplicationList(response.data) as unknown as ApplicationSummary[];
    const page = (response.data ?? {}) as PagedResponse<ApplicationSummary> & {
      Items?: ApplicationSummary[];
      PageIndex?: number;
      PageSize?: number;
      TotalCount?: number;
    };
    return {
      items,
      pageIndex: page.pageIndex ?? page.PageIndex ?? 1,
      pageSize: page.pageSize ?? page.PageSize ?? items.length,
      totalCount: page.totalCount ?? page.TotalCount ?? items.length,
    };
  },

  /** Hồ sơ còn hiệu lực của tôi trên một dự án — dùng để tiếp tục nháp, tránh POST 409. */
  findMineForProject: async (
    projectId: string,
  ): Promise<{ applicationId: string; applicationStatus: string } | null> => {
    const mine = await housingApplicationApi.getMyApplications();
    const pid = String(projectId || '').trim().toLowerCase();
    const hit = (mine.items || []).find((row) => {
      const raw = row as ApplicationSummary & { ProjectId?: string; ApplicationStatus?: string };
      const p = String(raw.projectId ?? raw.ProjectId ?? '').trim().toLowerCase();
      const s = String(raw.applicationStatus ?? raw.ApplicationStatus ?? '').toUpperCase();
      return p === pid && !DEAD_APPLICATION_STATUSES.has(s);
    });
    if (!hit) return null;
    const raw = hit as ApplicationSummary & { ApplicationId?: string; ApplicationStatus?: string };
    const applicationId = String(raw.applicationId ?? raw.ApplicationId ?? '').trim();
    if (!applicationId) return null;
    return {
      applicationId,
      applicationStatus: String(raw.applicationStatus ?? raw.ApplicationStatus ?? '').toUpperCase(),
    };
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

  /** Kiểm tra hồ sơ đang hoạt động — chặn tạo mới nếu đã có. */
  activeCheck: async (): Promise<{ hasActiveApplication: boolean; message?: string }> => {
    const response = await apiClient.get<{
      hasActiveApplication?: boolean;
      HasActiveApplication?: boolean;
      message?: string;
    }>('/housing-applications/active-check');
    const data = response.data ?? {};
    return {
      hasActiveApplication: Boolean(data.hasActiveApplication ?? data.HasActiveApplication),
      message: data.message,
    };
  },
};
