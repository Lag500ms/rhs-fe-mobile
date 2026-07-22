import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getUnreadCount } from '../api/notificationApi';
import { getToken } from '../../../lib/tokenStorage';

const POLLING_INTERVAL = 30_000;

/** Badge số chưa đọc — chỉ gọi API khi đã đăng nhập. */
export const useNotificationBadge = (): number => {
  const [unreadCount, setUnreadCount] = useState(0);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback((): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchUnreadCount = useCallback(async (): Promise<void> => {
    try {
      const token = await getToken();
      if (!token) {
        setUnreadCount(0);
        stopPolling();
        return;
      }
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, [stopPolling]);

  const startPolling = useCallback((): void => {
    stopPolling();
    void (async () => {
      const token = await getToken();
      if (!token) {
        setUnreadCount(0);
        return;
      }
      await fetchUnreadCount();
      intervalRef.current = setInterval(() => {
        void fetchUnreadCount();
      }, POLLING_INTERVAL);
    })();
  }, [fetchUnreadCount, stopPolling]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus): void => {
      if (
        appState.current.match(/inactive|background/)
        && nextAppState === 'active'
      ) {
        startPolling();
      } else if (nextAppState.match(/inactive|background/)) {
        stopPolling();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    startPolling();

    return (): void => {
      stopPolling();
      subscription.remove();
    };
  }, [startPolling, stopPolling]);

  return unreadCount;
};
