import apiClient from '../../../lib/apiClient';

export interface AnnouncementAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface AnnouncementDto {
  id: string;
  title: string;
  content: string;
  announcementType: string;
  legalDocumentNumber?: string | null;
  effectiveDate?: string | null;
  expirationDate?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  isPinned: boolean;
  status: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string | null;
  attachments: AnnouncementAttachment[];
}

export interface PagedAnnouncements {
  items: AnnouncementDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

function mapAttachment(raw: any): AnnouncementAttachment {
  return {
    id: String(raw?.id ?? raw?.Id ?? ''),
    fileName: String(raw?.fileName ?? raw?.FileName ?? ''),
    fileUrl: String(raw?.fileUrl ?? raw?.FileUrl ?? ''),
    contentType: String(raw?.contentType ?? raw?.ContentType ?? ''),
    fileSize: Number(raw?.fileSize ?? raw?.FileSize ?? 0),
    uploadedAt: String(raw?.uploadedAt ?? raw?.UploadedAt ?? ''),
  };
}

export function parseAnnouncement(data: any): AnnouncementDto | null {
  if (!data || typeof data !== 'object') return null;
  const atts = data.attachments ?? data.Attachments;
  return {
    id: String(data.id ?? data.Id ?? ''),
    title: String(data.title ?? data.Title ?? ''),
    content: String(data.content ?? data.Content ?? ''),
    announcementType: String(data.announcementType ?? data.AnnouncementType ?? ''),
    legalDocumentNumber: data.legalDocumentNumber ?? data.LegalDocumentNumber ?? null,
    effectiveDate: data.effectiveDate ?? data.EffectiveDate ?? null,
    expirationDate: data.expirationDate ?? data.ExpirationDate ?? null,
    projectId: data.projectId ?? data.ProjectId ?? null,
    projectName: data.projectName ?? data.ProjectName ?? null,
    isPinned: Boolean(data.isPinned ?? data.IsPinned),
    status: String(data.status ?? data.Status ?? ''),
    createdBy: String(data.createdBy ?? data.CreatedBy ?? ''),
    createdByName: String(data.createdByName ?? data.CreatedByName ?? ''),
    createdAt: String(data.createdAt ?? data.CreatedAt ?? ''),
    updatedAt: data.updatedAt ?? data.UpdatedAt ?? null,
    attachments: Array.isArray(atts) ? atts.map(mapAttachment) : [],
  };
}

export function parsePagedAnnouncements(data: any): PagedAnnouncements {
  if (!data || typeof data !== 'object') {
    return { items: [], totalCount: 0, page: 1, pageSize: 10 };
  }
  const rawItems = data.items ?? data.Items ?? [];
  const items = Array.isArray(rawItems)
    ? (rawItems.map(parseAnnouncement).filter(Boolean) as AnnouncementDto[])
    : [];
  return {
    items,
    totalCount: Number(data.totalCount ?? data.TotalCount ?? items.length),
    page: Number(data.page ?? data.Page ?? 1),
    pageSize: Number(data.pageSize ?? data.PageSize ?? 10),
  };
}

export const announcementsApi = {
  getPublished: async (params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    search?: string;
  }): Promise<PagedAnnouncements> => {
    const response = await apiClient.get('/announcements', {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        type: params?.type || undefined,
        search: params?.search || undefined,
      },
    });
    return parsePagedAnnouncements(response.data);
  },

  getById: async (id: string): Promise<AnnouncementDto | null> => {
    const response = await apiClient.get(`/announcements/${id}`);
    return parseAnnouncement(response.data);
  },
};

export const ANNOUNCEMENT_TYPE_LABEL: Record<string, string> = {
  OFFICIAL: 'Thông báo chính thức',
  LOTTERY: 'Lịch bốc thăm',
  PRICE_ADJUSTMENT: 'Điều chỉnh giá',
  GENERAL: 'Chung',
};
