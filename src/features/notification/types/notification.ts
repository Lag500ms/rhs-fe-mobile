export interface Notification {
  notificationId: string;
  title: string;
  content: string;
  notificationType: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  items: Notification[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UnreadCountResponse {
  success: boolean;
  unreadCount: number;
}
