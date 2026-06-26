import apiClient from '../../../lib/apiClient';

// ─── Types & Enums ──────────────────────────────────────────────

export enum NotificationType {
  DEPOSIT_PAID = 'DEPOSIT_PAID',
  APPLICATION_REJECTED = 'APPLICATION_REJECTED',
  APPLICATION_APPROVED = 'APPLICATION_APPROVED',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',
  PAYMENT_DUE = 'PAYMENT_DUE',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  DOCUMENT_EXPIRING = 'DOCUMENT_EXPIRING',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface NotificationListResponse {
  items: Notification[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface UnreadCountResponse {
  count: number;
}

// ─── API Functions ──────────────────────────────────────────────

/**
 * GET /api/notification/my
 * Lấy danh sách thông báo của user hiện tại với phân trang
 */
export const getMyNotifications = async (
  page: number = 1,
  pageSize: number = 20
): Promise<NotificationListResponse> => {
  const response = await apiClient.get<NotificationListResponse>(
    '/api/notification/my',
    { params: { page, pageSize } }
  );
  return response.data;
};

/**
 * GET /api/notification/unread-count
 * Lấy số lượng thông báo chưa đọc
 */
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  const response = await apiClient.get<UnreadCountResponse>(
    '/api/notification/unread-count'
  );
  return response.data;
};

/**
 * PUT /api/notification/{id}/read
 * Đánh dấu một thông báo là đã đọc
 */
export const markAsRead = async (id: string): Promise<void> => {
  await apiClient.put(`/api/notification/${id}/read`);
};

/**
 * PUT /api/notification/read-all
 * Đánh dấu tất cả thông báo là đã đọc
 */
export const markAllAsRead = async (): Promise<void> => {
  await apiClient.put('/api/notification/read-all');
};