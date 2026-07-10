export interface PagedResult<T> {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  items: T[];
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface WishlistItemResponse {
  wishlistId: string;
  addedAt: string;

  projectId: string;
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
  status?: string;
}
