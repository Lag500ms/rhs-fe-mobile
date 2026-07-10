import apiClient from '../../../lib/apiClient';
import {
  IssueReportDetail,
  IssueReportListItem,
  PagedResult,
  CreateIssueReportRequest,
} from '../types/issueReport';

export const issueReportApi = {
  /** Tạo báo cáo lỗi/góp ý mới (yêu cầu đăng nhập) */
  create: async (data: CreateIssueReportRequest): Promise<IssueReportDetail> => {
    const response = await apiClient.post<IssueReportDetail>(
      '/issue-reports',
      data,
    );
    return response.data;
  },

  /** Lấy danh sách góp ý/báo lỗi của người dùng hiện tại */
  getMyReports: async (
    pageIndex = 1,
    pageSize = 10,
  ): Promise<PagedResult<IssueReportListItem>> => {
    const response = await apiClient.get<PagedResult<IssueReportListItem>>(
      '/issue-reports/my-reports',
      {
        params: { pageIndex, pageSize },
      },
    );
    return response.data;
  },
};
