/**
 * Cấu hình trạng thái hồ sơ đăng ký nhà ở xã hội.
 * Map từ giá trị BE → màu sắc UI, nhãn và hành động hiển thị.
 */

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
  UNDER_REVIEW: {
    label: 'Đang thẩm định',
    bg: '#FFF8E1',
    textColor: '#F57F17',
    dotColor: '#F9A825',
  },
  PROPOSED: {
    label: 'Chờ phê duyệt',
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
      return 'Chưa có nhà ở';
    case 'SMALL_HOUSE':
      return 'Diện tích dưới 15m²';
    default:
      return value;
  }
}