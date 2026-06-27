import apiClient from '../../../lib/apiClient';

export interface ProjectImageResponse {
  id: string;
  imageUrl: string;
  displayOrder: number;
}

export interface HousingProjectResponse {
  id: string;
  projectName: string;
  description: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  availableUnits: number;
  thumbnailUrl?: string;
  lotteryDate?: string;
  lotteryLocation?: string;
  depositAmount: number;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  images: ProjectImageResponse[];
}

export interface HousingProjectFilterParams {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  province?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  statusId?: string;
}

export interface PagedResult<T> {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  items: T[];
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const housingApi = {
  getHousingProjects: async (
    params?: HousingProjectFilterParams
  ): Promise<PagedResult<HousingProjectResponse>> => {
    const response = await apiClient.get<PagedResult<HousingProjectResponse>>(
      '/HousingProjects',
      { params }
    );
    return response.data;
  },

  getHousingProjectById: async (
    id: string
  ): Promise<HousingProjectResponse> => {
    const response = await apiClient.get<HousingProjectResponse>(
      `/HousingProjects/${id}`
    );
    return response.data;
  },

  /**
   * Get suggested projects in the same ward as the given project.
   * Fetches a large page and filters client-side (no BE changes needed).
   */
  getSuggestedProjects: async (
    currentProjectId: string,
    ward: string,
    excludeIds: string[] = [],
    maxResults: number = 5
  ): Promise<HousingProjectResponse[]> => {
    if (!ward) return [];

    const result = await housingApi.getHousingProjects({
      pageIndex: 1,
      pageSize: 50, // fetch enough to filter client-side
    });

    const exclude = new Set([currentProjectId, ...excludeIds]);
    return result.items
      .filter(p => p.ward === ward && !exclude.has(p.id))
      .slice(0, maxResults);
  },
};