import React, { useState, useCallback, useRef } from 'react';
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
import { Ionicons, Feather } from '@expo/vector-icons';
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
import { housingApplicationApi } from '../../application/api/housingApplicationApi';
import { EmptyStateIllustration } from '../../../components/EmptyStateIllustration';

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

export const NotificationListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const showBack = route.name !== 'NotificationHome' && navigation.canGoBack();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const isFetchingRef = useRef<boolean>(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(
    async (page: number, isRefresh: boolean = false): Promise<void> => {
      const token = await getToken();
      if (!token) {
        setIsLoggedIn(false);
        setNotifications([]);
        setIsLoading(false);
        setIsRefreshing(false);
        setHasError(false);
        return;
      }

      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        setIsLoggedIn(true);
        setHasError(false);
        if (isRefresh) setIsRefreshing(true);
        else if (page === 1) setIsLoading(true);

        const response: NotificationListResponse = await getMyNotifications(page, 20);
        const items = response.items ?? [];
        setNotifications((prev) => (page === 1 ? items : [...prev, ...items]));
        setCurrentPage(response.page ?? page);
        setTotalPages(response.totalPages ?? 1);
      } catch {
        setHasError(true);
        if (page === 1) setNotifications([]);
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      void fetchNotifications(1);
    }, [fetchNotifications])
  );

  const handleRefresh = useCallback((): void => {
    void fetchNotifications(1, true);
  }, [fetchNotifications]);

  const handleEndReached = useCallback((): void => {
    if (!isLoggedIn || isLoadingMore || currentPage >= totalPages) return;
    setIsLoadingMore(true);
    void fetchNotifications(currentPage + 1);
  }, [isLoggedIn, isLoadingMore, currentPage, totalPages, fetchNotifications]);

  const handleMarkAsRead = useCallback(async (notification: Notification): Promise<void> => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.notificationId === notification.notificationId ? { ...item, isRead: true } : item
      )
    );
    try {
      await markAsRead(notification.notificationId);
    } catch {
      setNotifications((prev) =>
        prev.map((item) =>
          item.notificationId === notification.notificationId
            ? { ...item, isRead: notification.isRead }
            : item
        )
      );
      Alert.alert('Lỗi', 'Không thể đánh dấu đã đọc. Vui lòng thử lại.', [{ text: 'Đồng ý' }]);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async (): Promise<void> => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      Alert.alert('Lỗi', 'Không thể đánh dấu tất cả đã đọc. Vui lòng thử lại.', [
        { text: 'Đồng ý' },
      ]);
    }
  }, []);

  const handlePressNotification = useCallback(
    async (notification: Notification): Promise<void> => {
      if (!notification.isRead) {
        await handleMarkAsRead(notification);
      }
      const type = notification.notificationType;
      if (type === 'LOTTERY_SCHEDULED' || type === 'LOTTERY_RESULT_PUBLISHED') {
        const projectMatch = notification.content?.match(
          /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
        );
        if (projectMatch) {
          const projectId = projectMatch[0];
          let applicationId: string | undefined;
          try {
            const mine = await housingApplicationApi.getMyApplications();
            const match = (mine.items || []).find((a) => a.projectId === projectId);
            applicationId = match?.applicationId;
          } catch {
            /* optional */
          }
          navigation.navigate('Applications', {
            screen: type === 'LOTTERY_RESULT_PUBLISHED' ? 'LotteryResult' : 'LotterySchedule',
            params: { projectId, applicationId },
          });
          return;
        }
        navigation.navigate('Applications', { screen: 'MyLottery' });
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
    [handleMarkAsRead, navigation]
  );

  const renderNotificationItem = useCallback(
    ({ item }: { item: Notification }): React.ReactElement => {
      const config = NOTIFICATION_CONFIG[item.notificationType] || {
        icon: 'notifications-outline' as keyof typeof Ionicons.glyphMap,
        color: RHSColors.blue700,
        bg: RHSColors.blue50,
      };
      const formattedDate = item.createdAt
        ? new Date(item.createdAt).toLocaleString('vi-VN')
        : '';

      return (
        <TouchableOpacity
          style={[styles.itemContainer, !item.isRead && styles.unreadItemContainer]}
          onPress={() => void handlePressNotification(item)}
          activeOpacity={0.75}
        >
          <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={22} color={config.color} />
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.itemTitle, !item.isRead && styles.unreadTitle]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>

            <Text style={styles.message} numberOfLines={2}>
              {item.content}
            </Text>

            <Text style={styles.timestamp}>{formattedDate}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handlePressNotification]
  );

  const renderFooter = useCallback((): React.ReactNode => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={RHSColors.blue700} />
        <Text style={styles.footerText}>Đang tải thêm...</Text>
      </View>
    );
  }, [isLoadingMore]);

  const handleLoginPress = useCallback((): void => {
    navigation.navigate('Auth', { screen: 'Login', params: { returnTo: 'Account' } });
  }, [navigation]);

  const renderEmpty = useCallback((): React.ReactNode => {
    if (isLoading) return null;

    if (!isLoggedIn) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.illustrationWrap}>
            <EmptyStateIllustration name="notifications" size={240} />
          </View>
          <Text style={styles.emptyTitle}>Chưa đăng nhập</Text>
          <Text style={styles.emptyDesc}>
            Vui lòng đăng nhập để xem thông báo về hồ sơ, thanh toán và bốc thăm
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLoginPress}
            activeOpacity={0.85}
          >
            <Feather name="log-in" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.actionButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (hasError) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.illustrationWrap}>
            <View style={[styles.illustrationBox, { backgroundColor: RHSColors.amber50 }]}>
              <Feather name="alert-circle" size={72} color={RHSColors.amber700} />
            </View>
          </View>
          <Text style={styles.emptyTitle}>Không thể tải thông báo</Text>
          <Text style={styles.emptyDesc}>Kiểm tra kết nối mạng và thử lại.</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => void fetchNotifications(1)}
            activeOpacity={0.85}
          >
            <Feather name="refresh-cw" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.actionButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.illustrationWrap}>
          <EmptyStateIllustration name="notifications" size={240} />
        </View>
        <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
        <Text style={styles.emptyDesc}>
          Khi có cập nhật về hồ sơ hoặc thanh toán, thông báo sẽ hiện tại đây.
        </Text>
      </View>
    );
  }, [isLoading, isLoggedIn, hasError, fetchNotifications, handleLoginPress]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        {showBack ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={22} color={RHSColors.blue700} />
          </TouchableOpacity>
        ) : null}
        <Text style={styles.headerTitle}>Thông báo</Text>
        {isLoggedIn && unreadCount > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{unreadCount}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        {isLoggedIn && unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => void handleMarkAllAsRead()}
            style={styles.markAllBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.markAllBtnText}>Đọc hết</Text>
          </TouchableOpacity>
        )}
        {isLoggedIn && (
          <TouchableOpacity style={styles.headerRefresh} onPress={handleRefresh}>
            <Feather name="refresh-cw" size={20} color={RHSColors.blue700} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      ) : (
        <FlatList
          data={isLoggedIn ? notifications : []}
          keyExtractor={(item) => item.notificationId}
          renderItem={renderNotificationItem}
          contentContainerStyle={
            !isLoggedIn || notifications.length === 0
              ? styles.emptyListContent
              : styles.listContent
          }
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={isLoggedIn ? renderFooter : null}
          refreshControl={
            isLoggedIn ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[RHSColors.blue700]}
                tintColor={RHSColors.blue700}
              />
            ) : undefined
          }
          onEndReached={isLoggedIn ? handleEndReached : undefined}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: RHSColors.white,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.border,
  },
  headerBack: { marginRight: spacing.sm, padding: 2 },
  headerTitle: { ...typography.h1, color: RHSColors.text },
  countBadge: {
    marginLeft: spacing.sm,
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  countBadgeText: { ...typography.caption, fontWeight: '700', color: '#fff' },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginRight: 4,
  },
  markAllBtnText: { fontSize: 13, fontWeight: '700', color: RHSColors.blue700 },
  headerRefresh: { padding: 6 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  illustrationWrap: {
    marginBottom: spacing.xxl,
    width: '100%',
    alignItems: 'center',
  },
  illustrationBox: {
    width: 200,
    height: 180,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.h2,
    color: RHSColors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyDesc: {
    ...typography.bodySmall,
    color: RHSColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: RHSColors.blue700,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  actionButtonText: { ...typography.buttonSmall, color: '#fff' },

  itemContainer: {
    flexDirection: 'row',
    backgroundColor: RHSColors.surfaceCard,
    padding: spacing.lg,
    marginBottom: spacing.sm,
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
  contentContainer: { flex: 1, justifyContent: 'space-between' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemTitle: {
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
});
