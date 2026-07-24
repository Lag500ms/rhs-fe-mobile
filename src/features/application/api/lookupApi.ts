import apiClient from '../../../lib/apiClient';
import { PriorityGroupItem, RequiredDocumentItem } from '../types/application';

type LookupDocItem = { code?: string; Code?: string; label?: string; Label?: string };

function pickArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    const items = o.items ?? o.Items ?? o.data ?? o.Data;
    if (Array.isArray(items)) return items;
  }
  return [];
}

function parseDocItems(data: unknown): RequiredDocumentItem[] {
  return pickArray(data).map((it) => {
    const x = it as LookupDocItem;
    const code = String(x.code ?? x.Code ?? '');
    return {
      documentType: code,
      label: String(x.label ?? x.Label ?? code),
      subtitle: 'PDF, tối đa 10MB',
    };
  });
}

function parsePriorityGroups(data: unknown): PriorityGroupItem[] {
  return pickArray(data)
    .map((it) => {
      const x = it as Record<string, unknown>;
      return {
        code: String(x.code ?? x.Code ?? ''),
        label: String(x.label ?? x.Label ?? x.code ?? ''),
        requiresIncomeCertificate: Boolean(
          x.requiresIncomeCertificate ?? x.RequiresIncomeCertificate,
        ),
        isPovertyGroup: Boolean(x.isPovertyGroup ?? x.IsPovertyGroup),
        requiredDocumentType: (x.requiredDocumentType ??
          x.RequiredDocumentType) as string | null | undefined,
        requiredDocumentLabel: (x.requiredDocumentLabel ??
          x.RequiredDocumentLabel) as string | null | undefined,
      };
    })
    .filter((g) => !!g.code);
}

export const lookupApi = {
  /** GET /api/lookup/priority-groups */
  getPriorityGroups: async (): Promise<PriorityGroupItem[]> => {
    const response = await apiClient.get('/lookup/priority-groups');
    return parsePriorityGroups(response.data);
  },

  /**
   * GET /api/lookup/document-types/required?priorityGroup=...
   * Bắt buộc có priorityGroup — thiếu thì không gọi API (tránh checklist chỉ còn 1 giấy).
   */
  getRequiredDocumentTypes: async (
    priorityGroup: string | null | undefined,
  ): Promise<RequiredDocumentItem[]> => {
    const group = priorityGroup?.trim();
    if (!group) {
      throw new Error('MISSING_PRIORITY_GROUP');
    }
    const response = await apiClient.get('/lookup/document-types/required', {
      params: { priorityGroup: group },
    });
    return parseDocItems(response.data);
  },
};
