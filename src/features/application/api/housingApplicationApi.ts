import apiClient from '../../../lib/apiClient';
import {
  CreateApplicationRequest,
  CreateApplicationResponse,
  ApplicationSummary,
  ApplicationDetail,
  PagedResponse,
} from '../types/application';

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

  /**
   * Tạo lại hồ sơ mới từ hồ sơ cũ đã EXPIRED.
   * Copy thông tin định danh, trạng thái DRAFT.
   * POST /api/housing-applications/re-apply/{oldApplicationId}
   */
  reApply: async (oldApplicationId: string): Promise<CreateApplicationResponse> => {
    const response = await apiClient.post<CreateApplicationResponse>(
      `/housing-applications/re-apply/${oldApplicationId}`
    );
    return response.data;
  },
};