/**
 * Cấu hình trạng thái hồ sơ đăng ký nhà ở xã hội.
 * Map từ giá trị BE → màu sắc UI, nhãn và hành động hiển thị.
 */

import { RHSColors } from '../../../lib/theme';

export interface StatusConfig {  label: string;
  bg: string;
  textColor: string;
  dotColor: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT: {
    label: 'Nháp',
    bg: '#F5F5F5',
    textColor: '#757575',
    dotColor: '#9E9E9E',
  },
  SUBMITTED: {
    label: 'Đã nộp',
    bg: '#E3F2FD',
    textColor: '#1565C0',
    dotColor: '#1E88E5',
  },
  REVIEWING: {
    label: 'Đang xét duyệt',
    bg: '#FFF8E1',
    textColor: '#F57F17',
    dotColor: '#F9A825',
  },
  PENDING_SXD_REVIEW: {
    label: 'Chờ Sở Xây dựng',
    bg: '#E3F2FD',
    textColor: '#1565C0',
    dotColor: '#1E88E5',
  },
  NEED_MORE_DOCUMENTS: {
    label: 'Cần bổ sung',
    bg: '#FFF3E0',
    textColor: '#E65100',
    dotColor: '#FF9800',
  },
  APPROVED: {
    label: 'Chờ thanh toán',
    bg: '#E8F5E9',
    textColor: '#2E7D32',
    dotColor: '#4CAF50',
  },
  REJECTED: {
    label: 'Bị từ chối',
    bg: '#FFEBEE',
    textColor: '#C62828',
    dotColor: '#EF5350',
  },
  DEPOSIT_PAID: {
    label: 'Đã đặt cọc',
    bg: '#E8F5E9',
    textColor: '#1B5E20',
    dotColor: '#2E7D32',
  },
  CONTRACT_SIGNED: {
    label: 'Đã ký hợp đồng',
    bg: '#E8EAF6',
    textColor: '#283593',
    dotColor: '#3F51B5',
  },
  FULLY_PAID: {
    label: 'Đã thanh toán đủ',
    bg: '#E0F2F1',
    textColor: '#00695C',
    dotColor: '#00897B',
  },
  EXPIRED: {
    label: 'Hết hạn',
    bg: '#ECEFF1',
    textColor: '#78909C',
    dotColor: '#90A4AE',
  },
  CANCELED: {
    label: 'Đã hủy',
    bg: '#ECEFF1',
    textColor: '#78909C',
    dotColor: '#90A4AE',
  },
};

export function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status] || {
    label: status || 'Không xác định',
    bg: '#F5F5F5',
    textColor: '#757575',
    dotColor: '#9E9E9E',
  };
}

export function getHousingStatusLabel(value: string): string {
  switch (value) {
    case 'NO_HOUSE':
      return 'Chưa có nhà ở thuộc sở hữu';
    case 'SMALL_HOUSE':
      return 'Có nhà ở nhưng diện tích bình quân < 15 m²/người';
    default:
      return value;
  }
}

export interface StatusAction {
  label: string;
  icon: string;
  color: string;
}

export function getActionForStatus(status: string): StatusAction | null {
  switch (status) {
    case 'DRAFT':
      return { label: 'Tiếp tục hồ sơ', icon: 'edit-2', color: RHSColors.blue700 };
    case 'NEED_MORE_DOCUMENTS':
      return { label: 'Cập nhật giấy tờ', icon: 'upload', color: RHSColors.amber700 };
    case 'SUBMITTED':
    case 'REVIEWING':
    case 'PENDING_SXD_REVIEW':
      return { label: 'Xem chi tiết', icon: 'eye', color: RHSColors.blue700 };
    case 'APPROVED':
      return { label: 'Thanh toán ngay', icon: 'credit-card', color: RHSColors.red600 };
    case 'DEPOSIT_PAID':
      return { label: 'Xem hợp đồng / kết quả', icon: 'award', color: RHSColors.green600 };
    case 'CONTRACT_SIGNED':
      return { label: 'Lịch thanh toán', icon: 'calendar', color: RHSColors.blue700 };
    case 'FULLY_PAID':
      return { label: 'Xem lịch thanh toán', icon: 'check-circle', color: RHSColors.green600 };
    case 'REJECTED':
      return { label: 'Xem chi tiết', icon: 'eye', color: RHSColors.red600 };
    case 'EXPIRED':
      return { label: 'Đã hết hạn', icon: 'clock', color: RHSColors.grey500 };
    case 'CANCELED':
      return { label: 'Đã hủy', icon: 'x-circle', color: RHSColors.grey500 };
    default:
      return null;
  }
}