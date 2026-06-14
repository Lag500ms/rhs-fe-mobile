import apiClient from '../../../lib/apiClient';

export interface IssueReportDetail {
  id: string;
  title: string;
  description: string;
  issueType: string;
  status: string;
  screenshotUrl?: string;
  createdAt: string;
  resolvedAt?: string;
  reporterName: string;
  reporterId: string;
}

export interface IssueReportListItem {
  id: string;
  title: string;
  issueType: string;
  status: string;
  createdAt: string;
  reporterName: string;
}

export interface PagedResult<T> {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  items: T[];
}

export interface CreateIssueReportRequest {
  title: string;
  description: string;
  issueType: string;
  screenshotUrl?: string;
}

export interface UpdateIssueReportStatusRequest {
  status: string;
}

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