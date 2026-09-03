export interface ProjectImageResponse {
  id: string;
  imageUrl: string;
  displayOrder: number;
}

export interface ApartmentResponse {
  id: string;
  projectId?: string;
  unitName: string;
  floorNumber?: number;
  buildingBlock?: string | null;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  /** Diện tích thông thủy (m²) */
  area: number;
  /** Diện tích tim tường (m²) */
  grossArea?: number | null;
  mainDoorDirection?: string | null;
  mainDoorDirectionLabel?: string | null;
  balconyDirection?: string | null;
  balconyDirectionLabel?: string | null;
  viewDescription?: string | null;
  maxOccupants?: number | null;
  minSuitableIncome?: number | null;
  maxSuitableIncome?: number | null;
  /** PRIORITY | STANDARD */
  unitGroup?: string | null;
  unitGroupLabel?: string | null;
  /** FULL_OWNERSHIP | CO_OWNERSHIP */
  saleType?: string | null;
  saleTypeLabel?: string | null;
  coOwnershipRatio?: number | null;
  price: number;
  /** AVAILABLE | ASSIGNED */
  status: string;
  description?: string | null;
  apartmentType?: string | null;
  apartmentTypeLabel?: string | null;
}

export interface ProjectMilestoneResponse {
  id: string;
  projectId?: string;
  phaseOrder: number;
  phaseName: string;
  calculationType?: string;
  fixedAmount?: number | null;
  percentage?: number | null;
  triggerEvent?: string;
  triggerEventLabel?: string | null;
  dueDays?: number;
  description?: string | null;
  isActive?: boolean;
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
  /** Tỉ lệ Đợt 1 (cọc) nếu BE còn trả field này — ưu tiên lấy từ milestones[0].percentage. Trần 30%. */
  phase1Percentage?: number;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  decisionNumber?: string | null;
  applicationOpenDate?: string | null;
  applicationCloseDate?: string | null;
  images: ProjectImageResponse[];
  apartments?: ApartmentResponse[];
  milestones?: ProjectMilestoneResponse[];
}

export function unitGroupLabel(apt: ApartmentResponse): string {
  if (apt.unitGroupLabel) return apt.unitGroupLabel;
  return String(apt.unitGroup || '').toUpperCase() === 'PRIORITY'
    ? 'Căn hộ ưu tiên'
    : 'Căn hộ tiêu chuẩn';
}

export function saleTypeLabel(apt: ApartmentResponse): string {
  if (apt.saleTypeLabel) return apt.saleTypeLabel;
  const t = String(apt.saleType || '').toUpperCase();
  if (t === 'CO_OWNERSHIP') {
    const ratio = apt.coOwnershipRatio != null ? ` (${apt.coOwnershipRatio}%)` : '';
    return `Đồng sở hữu${ratio}`;
  }
  return 'Sở hữu 100%';
}

export function isPriorityUnit(apt: ApartmentResponse): boolean {
  return String(apt.unitGroup || '').toUpperCase() === 'PRIORITY';
}

export function isCoOwnership(apt: ApartmentResponse): boolean {
  return String(apt.saleType || '').toUpperCase() === 'CO_OWNERSHIP';
}

export function sortedMilestones(project: HousingProjectResponse): ProjectMilestoneResponse[] {
  return [...(project.milestones || [])].sort((a, b) => a.phaseOrder - b.phaseOrder);
}

/** Đợt 1 trên lịch CĐT = tiền cọc, tối đa 30% giá căn. */
export function getDepositMilestone(
  project: HousingProjectResponse,
): ProjectMilestoneResponse | undefined {
  const list = sortedMilestones(project);
  return list.find((m) => m.phaseOrder === 1) ?? list[0];
}

export function formatPaymentScheduleHint(project: HousingProjectResponse): string {
  const list = sortedMilestones(project);
  const deposit = getDepositMilestone(project);
  const pct = deposit?.percentage ?? project.phase1Percentage;
  const pctText =
    pct != null && Number(pct) > 0 ? ` ${Number(pct)}% giá căn` : '';

  if (list.length > 0) {
    return `Chủ đầu tư cấu hình ${list.length} đợt đóng tiền. Đợt 1 là tiền cọc${pctText} (tối đa 30%).`;
  }
  if (pct != null && Number(pct) > 0) {
    return `Đợt 1 là tiền cọc ${Number(pct)}% giá căn (tối đa 30%). Số đợt còn lại do chủ đầu tư công bố.`;
  }
  return 'Chủ đầu tư cấu hình số đợt đóng tiền theo tiến độ. Đợt 1 là tiền cọc, tối đa 30% giá căn.';
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
