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
