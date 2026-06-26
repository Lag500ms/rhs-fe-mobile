import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getUnreadCount, UnreadCountResponse } from '../api/notificationApi';

const POLLING_INTERVAL = 30_000; // 30 seconds

export const useNotificationBadge = (): number => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = useCallback(async (): Promise<void> => {
    try {
      const response: UnreadCountResponse = await getUnreadCount();
      setUnreadCount(response.count);
    } catch (error) {
      // Không làm crash app, giữ nguyên count cũ
      console.warn('Failed to fetch unread count:', error);
    }
  }, []);

  const startPolling = useCallback((): void => {
    // Clear interval cũ nếu có
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Gọi API ngay lập tức
    fetchUnreadCount();

    // Bắt đầu timer mới
    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, POLLING_INTERVAL);
  }, [fetchUnreadCount]);

  const stopPolling = useCallback((): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus): void => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App quay lại active: gọi API ngay và bắt đầu lại timer
        startPolling();
      } else if (nextAppState.match(/inactive|background/)) {
        // App chuyển sang background/inactive: dừng polling
        stopPolling();
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    // Khởi tạo polling khi mount
    startPolling();

    // Cleanup khi unmount
    return (): void => {
      stopPolling();
      subscription.remove();
    };
  }, [startPolling, stopPolling]);

  return unreadCount;
};