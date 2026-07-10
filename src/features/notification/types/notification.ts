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
