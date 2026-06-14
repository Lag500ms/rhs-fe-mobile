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
  address: string;
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  availableUnits: number;
  thumbnailUrl?: string;
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
};