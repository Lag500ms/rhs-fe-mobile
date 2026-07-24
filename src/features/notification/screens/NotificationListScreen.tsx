import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../../components/ScreenHeader';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from '../api/notificationApi';
import { Notification, NotificationListResponse } from '../types/notification';
import { getToken } from '../../../lib/tokenStorage';
import {
  RHSColors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../../lib/theme';

// ─── Icon & Color mapping theo NotificationType ──────────────────

const NOTIFICATION_CONFIG: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  DEPOSIT_PAID: {
    icon: 'cash-outline',
    color: RHSColors.green700,
    bg: RHSColors.green50,
  },
  APPLICATION_REJECTED: {
    icon: 'close-circle-outline',
    color: RHSColors.red700,
    bg: RHSColors.red50,
  },
  APPLICATION_APPROVED: {
    icon: 'checkmark-circle-outline',
    color: RHSColors.green700,
    bg: RHSColors.green50,
  },
  CONTRACT_SIGNED: {
    icon: 'document-text-outline',
    color: RHSColors.blue700,
    bg: RHSColors.blue50,
  },
  PAYMENT_DUE: {
    icon: 'calendar-outline',
    color: RHSColors.amber700,
    bg: RHSColors.amber50,
  },
  PAYMENT_OVERDUE: {
    icon: 'alert-circle-outline',
    color: RHSColors.red700,
    bg: RHSColors.red50,
  },
  DOCUMENT_EXPIRING: {
    icon: 'time-outline',
    color: RHSColors.amber700,
    bg: RHSColors.amber50,
  },
  SYSTEM_ANNOUNCEMENT: {
    icon: 'megaphone-outline',
    color: RHSColors.blue700,
    bg: RHSColors.blue50,
  },
  APPOINTMENT_REMINDER: {
    icon: 'alarm-outline',
    color: RHSColors.blue600,
    bg: RHSColors.blue50,
  },
  LOTTERY_SCHEDULED: {
    icon: 'calendar-outline',
    color: RHSColors.amber700,
    bg: RHSColors.amber50,
  },
  LOTTERY_RESULT_PUBLISHED: {
    icon: 'trophy-outline',
    color: RHSColors.green700,
    bg: RHSColors.green50,
  },
};

// ─── Component ──────────────────────────────────────────────────

export const NotificationListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  // Tab root (NotificationHome) không hiện nút back — tránh god/duplicate chrome
  const showBack = route.name !== 'NotificationHome' && navigation.canGoBack();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  // Dùng ref để tránh race condition khi gọi API nhiều lần
  const isFetchingRef = useRef<boolean>(false);

  // ─── Fetch notifications ──────────────────────────────────────

  const fetchNotifications = useCallback(
    async (page: number, isRefresh: boolean = false): Promise<void> => {
      const token = await getToken();
      if (!token) {
        setIsLoggedIn(false);
        setNotifications([]);
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
        setHasError(false);
        return;
      }

      setIsLoggedIn(true);
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        setHasError(false);

        if (isRefresh) {
          setIsRefreshing(true);
        } else if (page === 1) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const response: NotificationListResponse = await getMyNotifications(
          page,
          20
        );

        setNotifications((prev) =>
          page === 1 ? response.items : [...prev, ...response.items]
        );
        setCurrentPage(response.page);
        setTotalPages(response.totalPages);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    []
  );

  // ─── Load first page khi màn hình được focus ──────────────────

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const token = await getToken();
        // Chưa đăng nhập: không reload / không gọi API
        if (!token) {
          setIsLoggedIn(false);
          setNotifications([]);
          setIsLoading(false);
          setIsRefreshing(false);
          setHasError(false);
          return;
        }
        await fetchNotifications(1);
      })();
    }, [fetchNotifications])
  );

  // ─── Pull to refresh ──────────────────────────────────────────

  const handleRefresh = useCallback(async (): Promise<void> => {
    const token = await getToken();
    if (!token) {
      setIsLoggedIn(false);
      setIsRefreshing(false);
      return;
    }
    await fetchNotifications(1, true);
  }, [fetchNotifications]);

  // ─── Infinite scroll ──────────────────────────────────────────

  const handleEndReached = useCallback((): void => {
    if (
      !isLoggedIn
      || isFetchingRef.current
      || isLoadingMore
      || currentPage >= totalPages
    ) {
      return;
    }
    void fetchNotifications(currentPage + 1);
  }, [isLoggedIn, currentPage, totalPages, isLoadingMore, fetchNotifications]);

  // ─── Mark as read ─────────────────────────────────────────────

  const handleMarkAsRead = useCallback(
    async (notification: Notification): Promise<void> => {
      // Optimistic update: cập nhật UI ngay lập tức
      setNotifications((prev) =>
        prev.map((item) =>
          item.notificationId === notification.notificationId ? { ...item, isRead: true } : item
        )
      );

      try {
        await markAsRead(notification.notificationId);
      } catch (error) {
        // Rollback nếu API fail
        console.error('Failed to mark as read:', error);
        setNotifications((prev) =>
          prev.map((item) =>
            item.notificationId === notification.notificationId
              ? { ...item, isRead: notification.isRead }
              : item
          )
        );
        Alert.alert(
          'Lỗi',
          'Không thể đánh dấu đã đọc. Vui lòng thử lại.',
          [{ text: 'OK' }]
        );
      }
    },
    []
  );

  // ─── Mark all as read ─────────────────────────────────────────

  const handleMarkAllAsRead = useCallback(async (): Promise<void> => {
    try {
      await markAllAsRead();
      // Cập nhật toàn bộ notifications thành isRead = true
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true }))
      );
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      Alert.alert(
        'Lỗi',
        'Không thể đánh dấu tất cả đã đọc. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  // ─── Navigate to detail ───────────────────────────────────────

  const handlePressNotification = useCallback(
    async (notification: Notification): Promise<void> => {
      if (!notification.isRead) {
        await handleMarkAsRead(notification);
      }
      const type = notification.notificationType;
      // Deep-link gần đúng: mở tab Hồ sơ; lịch bốc thăm mở qua Applications stack nếu có projectId trong content
      if (type === 'LOTTERY_SCHEDULED' || type === 'LOTTERY_RESULT_PUBLISHED') {
        const projectMatch = notification.content?.match(
          /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
        );
        if (projectMatch) {
          navigation.navigate('Applications', {
            screen: type === 'LOTTERY_RESULT_PUBLISHED' ? 'LotteryResult' : 'LotterySchedule',
            params: { projectId: projectMatch[0] },
          });
          return;
        }
        navigation.navigate('Applications');
        return;
      }
      if (
        type === 'APPLICATION_APPROVED' ||
        type === 'APPLICATION_REJECTED' ||
        type === 'DEPOSIT_PAID' ||
        type === 'CONTRACT_SIGNED' ||
        type === 'NEED_MORE_DOCUMENTS' ||
        type === 'PAYMENT_DUE' ||
        type === 'PAYMENT_OVERDUE'
      ) {
        navigation.navigate('Applications');
      }
    },
    [handleMarkAsRead, navigation],
  );

  // ─── Render item ──────────────────────────────────────────────

  const renderNotificationItem = useCallback(
    ({ item }: { item: Notification }) => {
      const config = NOTIFICATION_CONFIG[item.notificationType] || {
        icon: 'notifications-outline',
        color: RHSColors.blue700,
        bg: RHSColors.blue50,
      };

      const formattedDate = new Date(item.createdAt).toLocaleDateString(
        'vi-VN',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      );

      return (
        <TouchableOpacity
          onPress={() => handlePressNotification(item)}
          style={[
            styles.itemContainer,
            !item.isRead && styles.unreadItemContainer,
          ]}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: config.bg },
            ]}
          >
            <Ionicons
              name={config.icon}
              size={24}
              color={config.color}
            />
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  !item.isRead && styles.unreadTitle,
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>

            <Text
              style={styles.message}
              numberOfLines={2}
            >
              {item.content}
            </Text>

            <Text style={styles.timestamp}>{formattedDate}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handlePressNotification]
  );

  // ─── Render footer (loading more) ────────────────────────────

  const renderFooter = useCallback((): React.ReactNode => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={RHSColors.blue700} />
        <Text style={styles.footerText}>Đang tải thêm...</Text>
      </View>
    );
  }, [isLoadingMore]);

  // ─── Render empty state ───────────────────────────────────────

  const handleLoginPress = useCallback((): void => {
    navigation.navigate('Auth', { screen: 'Login' });
  }, [navigation]);

  const renderEmptyState = useCallback((): React.ReactNode => {
    if (isLoading || isLoggedIn === null) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
          <Text style={styles.emptyText}>Đang tải thông báo...</Text>
        </View>
      );
    }

    if (isLoggedIn === false) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed-outline" size={56} color={RHSColors.grey400} />
          <Text style={styles.emptyText}>Đăng nhập để xem thông báo</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleLoginPress}>
            <Text style={styles.retryButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (hasError) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={RHSColors.grey400}
          />
          <Text style={styles.emptyText}>Không thể tải thông báo</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => void fetchNotifications(1)}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="notifications-off-outline"
          size={64}
          color={RHSColors.grey400}
        />
        <Text style={styles.emptyText}>Không có thông báo nào</Text>
      </View>
    );
  }, [isLoading, isLoggedIn, hasError, fetchNotifications, handleLoginPress]);

  // ─── Header right action ──────────────────────────────────────

  const headerRightAction = isLoggedIn ? (
    <TouchableOpacity
      onPress={handleMarkAllAsRead}
      style={styles.markAllButton}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={styles.markAllButtonText}>Đánh dấu tất cả đã đọc</Text>
    </TouchableOpacity>
  ) : undefined;

  // ─── Main render ──────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Thông báo"
        showBack={showBack}
        rightAction={headerRightAction}
        isWhite={true}
      />

      {isLoading || isLoggedIn === null ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
          <Text style={styles.emptyText}>Đang tải thông báo...</Text>
        </View>
      ) : isLoggedIn === false ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.notificationId}
          renderItem={renderNotificationItem}
          contentContainerStyle={
            notifications.length === 0 ? styles.emptyListContent : undefined
          }
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          refreshControl={
            isLoggedIn ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[RHSColors.blue700]}
                tintColor={RHSColors.blue700}
                title="Đang làm mới..."
                titleColor={RHSColors.textSecondary}
              />
            ) : undefined
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={5}
        />
      )}
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RHSColors.surface,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: RHSColors.surfaceCard,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  unreadItemContainer: {
    backgroundColor: RHSColors.blue50,
    borderColor: RHSColors.blue200,
    borderWidth: 1.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: RHSColors.textSecondary,
    lineHeight: 20,
  },
  unreadTitle: {
    fontWeight: '700',
    color: RHSColors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: RHSColors.blue700,
    marginLeft: spacing.sm,
  },
  message: {
    fontSize: 14,
    color: RHSColors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  timestamp: {
    fontSize: 12,
    color: RHSColors.textMuted,
    lineHeight: 16,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  footerText: {
    fontSize: 13,
    color: RHSColors.textSecondary,
  },
  emptyText: {
    fontSize: 15,
    color: RHSColors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  retryButtonText: {
    color: RHSColors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  markAllButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  markAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: RHSColors.blue700,
  },
});