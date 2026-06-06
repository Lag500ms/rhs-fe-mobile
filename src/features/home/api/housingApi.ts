import axios from 'axios';

const API_BASE_URL = 'http://10.0.2.2:5112/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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