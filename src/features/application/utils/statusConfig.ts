/**
 * Cấu hình trạng thái hồ sơ đăng ký nhà ở xã hội.
 * Map BE → nhãn người dân (mobile). Cọc → ký; đợt sau ở lịch TT.
 */

import { RHSColors } from '../../../lib/theme';

export interface StatusConfig {
  label: string;
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
    label: 'Chủ đầu tư tiếp nhận',
    bg: '#FFF8E1',
    textColor: '#F57F17',
    dotColor: '#F9A825',
  },
  PENDING_SXD_REVIEW: {
    label: 'Sở Xây dựng tiếp nhận',
    bg: '#E3F2FD',
    textColor: '#1565C0',
    dotColor: '#1E88E5',
  },
  NEED_MORE_DOCUMENTS: {
    label: 'Cần bổ sung giấy tờ',
    bg: '#FFF3E0',
    textColor: '#E65100',
    dotColor: '#FF9800',
  },
  APPROVED: {
    label: 'Đã duyệt — chờ chốt suất',
    bg: '#E8F5E9',
    textColor: '#2E7D32',
    dotColor: '#4CAF50',
  },
  APPROVED_BY_TIMEOUT: {
    label: 'Đã duyệt — chờ chốt suất',
    bg: '#E8F5E9',
    textColor: '#2E7D32',
    dotColor: '#4CAF50',
  },
  DEPOSIT_PENDING: {
    label: 'Chờ đóng tiền cọc',
    bg: '#FFF3E0',
    textColor: '#E65100',
    dotColor: '#FF9800',
  },
  CONTRACT_PENDING: {
    label: 'Đã cấp suất — đóng cọc / ký HĐ',
    bg: '#E8EAF6',
    textColor: '#283593',
    dotColor: '#3F51B5',
  },
  CONTRACT_SIGNED: {
    label: 'Đã ký hợp đồng',
    bg: '#E8EAF6',
    textColor: '#283593',
    dotColor: '#3F51B5',
  },
  DEPOSIT_PAID: {
    label: 'Đã đóng cọc',
    bg: '#E8F5E9',
    textColor: '#1B5E20',
    dotColor: '#2E7D32',
  },
  INSTALLMENT_IN_PROGRESS: {
    label: 'Đang đóng các khoản còn lại',
    bg: '#E3F2FD',
    textColor: '#1565C0',
    dotColor: '#1E88E5',
  },
  FULLY_PAID: {
    label: 'Đã thanh toán đủ',
    bg: '#E0F2F1',
    textColor: '#00695C',
    dotColor: '#00897B',
  },
  LOTTERY_LOST: {
    label: 'Không trúng bốc thăm',
    bg: '#FFEBEE',
    textColor: '#C62828',
    dotColor: '#EF5350',
  },
  REJECTED: {
    label: 'Bị từ chối',
    bg: '#FFEBEE',
    textColor: '#C62828',
    dotColor: '#EF5350',
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

export function getStatusConfig(
  status: string,
  opts?: { hasApartment?: boolean; depositPaid?: boolean },
): StatusConfig {
  const key = (status || '').trim().toUpperCase();
  if (key === 'CONTRACT_PENDING') {
    if (opts?.hasApartment === false) {
      return {
        label: 'Đã trúng — chờ cấp căn',
        bg: '#E8EAF6',
        textColor: '#283593',
        dotColor: '#3F51B5',
      };
    }
    if (opts?.depositPaid === false) {
      return STATUS_CONFIG.DEPOSIT_PENDING;
    }
    if (opts?.depositPaid === true) {
      return {
        label: 'Chờ ký hợp đồng',
        bg: '#E8EAF6',
        textColor: '#283593',
        dotColor: '#3F51B5',
      };
    }
  }
  return STATUS_CONFIG[key] || {
    label: 'Trạng thái không xác định',
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
    case 'APPROVED_BY_TIMEOUT':
      return { label: 'Chờ chốt suất / lịch bốc thăm', icon: 'radio', color: RHSColors.blue700 };
    case 'DEPOSIT_PENDING':
      return { label: 'Đóng tiền cọc', icon: 'credit-card', color: RHSColors.red600 };
    case 'CONTRACT_PENDING':
      return { label: 'Đóng cọc / ký hợp đồng', icon: 'credit-card', color: RHSColors.red600 };
    case 'CONTRACT_SIGNED':
    case 'INSTALLMENT_IN_PROGRESS':
    case 'DEPOSIT_PAID':
      return { label: 'Xem lịch thanh toán', icon: 'calendar', color: RHSColors.blue700 };
    case 'LOTTERY_LOST':
      return { label: 'Xem kết quả bốc thăm', icon: 'eye', color: RHSColors.red600 };
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
