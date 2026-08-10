import apiClient from '../../../lib/apiClient';

/**
 * Public Post-check APIs (tra cứu công khai, không bắt buộc auth).
 *  - GET /api/public/post-check-list
 *  - GET /api/public/post-check-list/{applicationId}
 *  - GET /api/public/post-check-list/stats
 */

export interface PublicPostCheckItem {
  applicationId: string;
  fullName?: string;
  citizenId?: string;
  projectName?: string;
  applicationStatus?: string;
  slotCode?: string | null;
  lotteryResult?: string | null;
  finalDecisionDate?: string | null;
}

export interface PublicPostCheckStats {
  totalApplications?: number;
  approved?: number;
  rejected?: number;
  pending?: number;
  totalProjects?: number;
}

function pickArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    const items = o.items ?? o.Items ?? o.data ?? o.Data;
    if (Array.isArray(items)) return items;
  }
  return [];
}

function pickItem(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  const nested = o.data ?? o.Data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return o;
}

function mapItem(x: Record<string, unknown>): PublicPostCheckItem {
  return {
    applicationId: String(x.applicationId ?? x.ApplicationId ?? ''),
    fullName: (x.fullName ?? x.FullName) as string | undefined,
    citizenId: (x.citizenId ?? x.CitizenId) as string | undefined,
    projectName: (x.projectName ?? x.ProjectName) as string | undefined,
    applicationStatus: (x.applicationStatus ?? x.ApplicationStatus) as string | undefined,
    slotCode: (x.slotCode ?? x.SlotCode) as string | null | undefined,
    lotteryResult: (x.lotteryResult ?? x.LotteryResult) as string | null | undefined,
    finalDecisionDate: (x.finalDecisionDate ?? x.FinalDecisionDate) as string | null | undefined,
  };
}

export function parsePublicPostCheckList(data: unknown): PublicPostCheckItem[] {
  return pickArray(data)
    .map((it) => mapItem((it ?? {}) as Record<string, unknown>))
    .filter((it) => !!it.applicationId);
}

export function parsePublicPostCheckItem(data: unknown): PublicPostCheckItem | null {
  const o = pickItem(data);
  if (!o) return null;
  const item = mapItem(o);
  return item.applicationId ? item : null;
}

export function parsePublicPostCheckStats(data: unknown): PublicPostCheckStats | null {
  const o = pickItem(data);
  if (!o) return null;
  return {
    totalApplications: Number(o.totalApplications ?? o.TotalApplications ?? 0) || undefined,
    approved: Number(o.approved ?? o.Approved ?? 0) || undefined,
    rejected: Number(o.rejected ?? o.Rejected ?? 0) || undefined,
    pending: Number(o.pending ?? o.Pending ?? 0) || undefined,
    totalProjects: Number(o.totalProjects ?? o.TotalProjects ?? 0) || undefined,
  };
}

export const publicPostCheckApi = {
  list: async (): Promise<PublicPostCheckItem[]> => {
    const response = await apiClient.get('/public/post-check-list');
    return parsePublicPostCheckList(response.data);
  },

  getById: async (id: string): Promise<PublicPostCheckItem | null> => {
    const response = await apiClient.get(`/public/post-check-list/${id}`);
    return parsePublicPostCheckItem(response.data);
  },

  stats: async (): Promise<PublicPostCheckStats | null> => {
    const response = await apiClient.get('/public/post-check-list/stats');
    return parsePublicPostCheckStats(response.data);
  },
};
