export interface ProjectImageResponse {
  id: string;
  imageUrl: string;
  displayOrder: number;
}

export interface ApartmentResponse {
  id: string;
  unitName: string;
  area: number;
  price: number;
  /** AVAILABLE | ASSIGNED */
  status: string;
  description?: string | null;
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
  /** Tỉ lệ Đợt 1 công bố trên dự án (tham khảo). BE chuẩn: 6 đợt (10/20/20/20/25+PBT/5). */
  phase1Percentage?: number;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  images: ProjectImageResponse[];
  apartments?: ApartmentResponse[];
}

export interface HousingProjectFilterParams {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  province?: string;
  district?: string;
  /** Phường/xã — API địa giới v2 */
  ward?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  statusId?: string;
  /** Exact match BE StatusCode (OPEN | UPCOMING | CLOSED | FULL…). */
  statusCode?: string;
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
