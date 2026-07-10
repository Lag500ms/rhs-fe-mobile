import apiClient from '../../../lib/apiClient';
import {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from '../types/notification';

export type { Notification, NotificationListResponse, UnreadCountResponse };

export const getMyNotifications = async (
  page: number = 1,
  pageSize: number = 20
): Promise<NotificationListResponse> => {
  const response = await apiClient.get<{ success: boolean; data: NotificationListResponse }>(
    '/notification/my',
    { params: { page, pageSize } }
  );
  return response.data.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await apiClient.get<UnreadCountResponse>(
    '/notification/unread-count'
  );
  return response.data.unreadCount;
};

export const markAsRead = async (id: string): Promise<void> => {
  await apiClient.put(`/notification/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await apiClient.put('/notification/read-all');
};
