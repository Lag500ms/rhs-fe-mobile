/** Map trạng thái dự án — đồng bộ CAP/FE `labelProjectStatus`. */

export type ProjectStatusFilter = 'ALL' | 'OPEN' | 'UPCOMING' | 'CLOSED';

export const PROJECT_STATUS_FILTER_OPTIONS: {
  key: ProjectStatusFilter;
  label: string;
  statusCode?: string;
}[] = [
  { key: 'ALL', label: 'Đang mở + Sắp mở' },
  { key: 'OPEN', label: 'Đang mở đăng ký', statusCode: 'OPEN' },
  { key: 'UPCOMING', label: 'Sắp mở', statusCode: 'UPCOMING' },
  { key: 'CLOSED', label: 'Đã đóng', statusCode: 'CLOSED' },
];

const OPEN_VALUES = new Set([
  'open',
  'open_for_registration',
  'openforregistration',
  'đang mở đăng ký',
  'đang mở bán',
  'đang mở',
]);

const UPCOMING_VALUES = new Set([
  'upcoming',
  'sắp mở',
  'sắp mở bán',
  'coming soon',
]);

const CLOSED_VALUES = new Set([
  'closed',
  'đã đóng',
  'đã đóng đăng ký',
  'full',
  'đã đầy',
  'đã hết suất',
]);

function norm(status?: string | null): string {
  return String(status ?? '')
    .trim()
    .toLowerCase();
}

export function isOpenForRegistration(status?: string | null): boolean {
  return OPEN_VALUES.has(norm(status));
}

export function isUpcoming(status?: string | null): boolean {
  return UPCOMING_VALUES.has(norm(status));
}

export function isClosedOrFull(status?: string | null): boolean {
  return CLOSED_VALUES.has(norm(status));
}

/** Showcase mặc định: đang mở + sắp mở (giống web home). */
export function isBrowsableShowcase(status?: string | null): boolean {
  return isOpenForRegistration(status) || isUpcoming(status);
}

export function labelProjectStatus(status?: string | null): string {
  if (!status) return 'Không rõ';
  if (isOpenForRegistration(status)) return 'Đang mở đăng ký';
  if (isUpcoming(status)) return 'Sắp mở bán';
  if (isClosedOrFull(status)) {
    const n = norm(status);
    if (n.includes('full') || n.includes('đầy') || n.includes('hết suất')) return 'Đã hết suất';
    return 'Đã đóng đăng ký';
  }
  // Fallback: BE đôi khi trả StatusName EN
  const map: Record<string, string> = {
    pending: 'Chờ phê duyệt',
    rejected: 'Bị từ chối',
    upcoming: 'Sắp mở bán',
    open: 'Đang mở đăng ký',
    closed: 'Đã đóng đăng ký',
    full: 'Đã hết suất',
  };
  return map[norm(status)] ?? status;
}

export function statusBadgeColor(status?: string | null): string {
  if (isOpenForRegistration(status)) return 'rgba(46,125,50,0.92)';
  if (isUpcoming(status)) return 'rgba(245,127,23,0.92)';
  if (isClosedOrFull(status)) return 'rgba(97,97,97,0.92)';
  return 'rgba(21,101,192,0.92)';
}
