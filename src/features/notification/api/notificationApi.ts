import apiClient from '../../../lib/apiClient';
import {
  NotificationType,
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from '../types/notification';

export { NotificationType };
export type { Notification, NotificationListResponse, UnreadCountResponse };

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
