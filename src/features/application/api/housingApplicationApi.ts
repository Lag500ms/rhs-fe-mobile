import apiClient from '../../../lib/apiClient';

export interface CreateApplicationRequest {
  projectId: string;
  fullName: string;
  citizenId: string;
  occupation?: string;
  workPlace?: string;
  currentResidence: string;
  permanentAddress: string;
  housingStatus: string; // "NO_HOUSE" | "SMALL_HOUSE"
  estimatedMonthlyIncome: number;
}

export interface CreateApplicationResponse {
  applicationId: string;
  applicationStatus: string;
  createdAt: string;
  message: string;
}

export interface ApplicationDocument {
  documentId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  verificationStatus: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface ApplicationSummary {
  applicationId: string;
  projectName: string;
  applicationStatus: string;
  createdAt: string;
  updatedAt: string | null;
  documentCount: number;
}

export interface ReviewHistory {
  historyId: string;
  action: string;
  oldStatus: string;
  newStatus: string;
  note: string | null;
  changedAt: string;
  changedBy: string;
  changedByFullName: string;
}

export interface ApplicationDetail {
  applicationId: string;
  applicationStatus: string;
  priorityScore: number;
  createdAt: string;
  submittedAt: string | null;
  updatedAt: string | null;
  finalDecisionDate: string | null;

  projectId: string;
  projectName: string;

  applicantId: string;
  fullName: string;
  citizenId: string;
  occupation: string | null;
  workPlace: string | null;
  currentResidence: string;
  permanentAddress: string;
  housingStatus: string;
  estimatedMonthlyIncome: number;

  officerId: string | null;
  officerFullName: string | null;

  documents: ApplicationDocument[];
  reviewHistories: ReviewHistory[];
}

export interface PagedResponse<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
}

export const housingApplicationApi = {
  /**
   * Tạo hồ sơ đăng ký nhà ở xã hội (DRAFT).
   * POST /api/housing-applications
   */
  createApplication: async (data: CreateApplicationRequest): Promise<CreateApplicationResponse> => {
    const response = await apiClient.post<CreateApplicationResponse>(
      '/housing-applications',
      data
    );
    return response.data;
  },

  /**
   * Nộp hồ sơ sau khi đã upload đủ tài liệu.
   * POST /api/housing-applications/{id}/submit
   */
  submitApplication: async (applicationId: string): Promise<void> => {
    await apiClient.post(`/housing-applications/${applicationId}/submit`);
  },

  /**
   * Lấy danh sách hồ sơ của người dùng hiện tại.
   * GET /api/housing-applications/my
   */
  getMyApplications: async (): Promise<PagedResponse<ApplicationSummary>> => {
    const response = await apiClient.get<PagedResponse<ApplicationSummary>>(
      '/housing-applications/my'
    );
    return response.data;
  },

  /**
   * Lấy chi tiết hồ sơ theo ID.
   * GET /api/housing-applications/{id}
   */
  getApplicationDetail: async (applicationId: string): Promise<ApplicationDetail> => {
    const response = await apiClient.get<ApplicationDetail>(
      `/housing-applications/${applicationId}`
    );
    return response.data;
  },

  /**
   * Cập nhật thông tin hồ sơ (dùng cho EditInformation).
   * PUT /api/housing-applications/{id}
   */
  updateApplication: async (
    applicationId: string,
    data: Partial<CreateApplicationRequest>
  ): Promise<void> => {
    await apiClient.put(`/housing-applications/${applicationId}`, data);
  },
};