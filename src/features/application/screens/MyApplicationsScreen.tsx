import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RHSColors, borderRadius, shadows, spacing, typography } from '../../../lib/theme';
import { getToken } from '../../../lib/tokenStorage';
import { housingApplicationApi } from '../api/housingApplicationApi';
import { ApplicationSummary } from '../types/application';
import { ApplicationCard } from '../components/ApplicationCard';
import { DraftActionSheet } from '../components/DraftActionSheet';
import { getActionForStatus } from '../utils/statusConfig';

export const MyApplicationsScreen = () => {
  const navigation = useNavigation<any>();

  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [actionSheetApp, setActionSheetApp] = useState<ApplicationSummary | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    const token = await getToken();
    if (!token) {
      setIsLoggedIn(false);
      setApplications([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const result = await housingApplicationApi.getMyApplications();
      setApplications(result.items || []);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Không thể tải danh sách hồ sơ.';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const checkAuthAndLoad = useCallback(async () => {
    const token = await getToken();
    // Chưa đăng nhập: không reload / không gọi API
    if (!token) {
      setIsLoggedIn(false);
      setApplications([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setIsLoggedIn(true);
    try {
      await fetchData(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Không thể tải danh sách hồ sơ.';
      Alert.alert('Lỗi', msg);
      setLoading(false);
    }
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      void checkAuthAndLoad();
    }, [checkAuthAndLoad])
  );

  const hideTabBar = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({ tabBarStyle: { display: 'none' } });
    }
  };

  const showTabBar = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({ tabBarStyle: undefined });
    }
  };

  const handleViewDetail = (applicationId: string) => {
    navigation.navigate('ApplicationDetail', { applicationId });
  };

  const handleDraftAction = (item: ApplicationSummary) => {
    setActionSheetApp(item);
    setShowActionSheet(true);
    hideTabBar();
  };

  const handleCloseActionSheet = () => {
    setShowActionSheet(false);
    showTabBar();
  };

  const handleManageDocs = () => {
    if (!actionSheetApp) return;
    const item = actionSheetApp;
    setShowActionSheet(false);
    showTabBar();
    navigation.navigate('UploadDocuments', {
      applicationId: item.applicationId,
    });
  };

  const handleReviewSubmit = () => {
    if (!actionSheetApp) return;
    const item = actionSheetApp;
    setShowActionSheet(false);
    showTabBar();
    navigation.navigate('ReviewSubmit', {
      applicationId: item.applicationId,
    });
  };

  const handleAction = (item: ApplicationSummary) => {
    const action = getActionForStatus(item.applicationStatus);
    if (!action) {
      handleViewDetail(item.applicationId);
      return;
    }

    switch (item.applicationStatus) {
      case 'DRAFT':
        handleDraftAction(item);
        break;
      case 'NEED_MORE_DOCUMENTS':
        navigation.navigate('UploadDocuments', {
          applicationId: item.applicationId,
          applicationStatus: item.applicationStatus,
        });
        break;
      default:
        handleViewDetail(item.applicationId);
        break;
    }
  };

  const handleLoginPress = () => {
    navigation.navigate('Auth', { screen: 'Login', params: { returnTo: 'Account' } });
  };

  const renderEmpty = () => {
    if (loading) return null;

    if (!isLoggedIn) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.illustrationWrap}>
            <View style={[styles.illustrationBox, { backgroundColor: RHSColors.red50 }]}>
              <Feather name="file-text" size={72} color={RHSColors.govRed} />
            </View>
          </View>
          <Text style={styles.emptyTitle}>Chưa đăng nhập</Text>
          <Text style={styles.emptyDesc}>
            Vui lòng đăng nhập để xem danh sách hồ sơ đăng ký của bạn
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleLoginPress} activeOpacity={0.85}>
            <Feather name="log-in" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.actionButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.illustrationWrap}>
          <View style={[styles.illustrationBox, { backgroundColor: RHSColors.blue50 }]}>
            <Feather name="inbox" size={72} color={RHSColors.blue700} />
          </View>
        </View>
        <Text style={styles.emptyTitle}>Chưa có hồ sơ nào</Text>
        <Text style={styles.emptyDesc}>
          Bạn chưa đăng ký hồ sơ mua nhà ở xã hội nào. Hãy khám phá các dự án và tạo hồ sơ mới!
        </Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.getParent()?.navigate('Home', { screen: 'HomeList' })}
          activeOpacity={0.8}
        >
          <Feather name="search" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.actionButtonText}>Khám phá dự án</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ đăng ký</Text>
        {applications.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{applications.length}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        {isLoggedIn && (
          <TouchableOpacity style={styles.headerRefresh} onPress={() => fetchData(true)}>
            <Feather name="refresh-cw" size={20} color={RHSColors.blue700} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      ) : (
        <FlatList
          data={applications}
          renderItem={({ item }) => (
            <ApplicationCard item={item} onPress={handleAction} />
          )}
          keyExtractor={(item) => item.applicationId}
          contentContainerStyle={
            applications.length === 0 ? styles.emptyContainer : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            isLoggedIn ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchData(true)}
                colors={[RHSColors.blue700]}
                tintColor={RHSColors.blue700}
              />
            ) : undefined
          }
        />
      )}

      <DraftActionSheet
        visible={showActionSheet}
        onClose={handleCloseActionSheet}
        onManageDocs={handleManageDocs}
        onReviewSubmit={handleReviewSubmit}
      />
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
  headerTitle: { ...typography.h1, color: RHSColors.text },
  countBadge: {
    marginLeft: spacing.sm,
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  countBadgeText: { ...typography.caption, fontWeight: '700', color: '#fff' },
  headerRefresh: { padding: 6 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: RHSColors.surface,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    backgroundColor: RHSColors.surface,
    flexGrow: 1,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
    backgroundColor: RHSColors.surface,
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
  emptyTitle: { ...typography.h2, color: RHSColors.text, textAlign: 'center', marginBottom: spacing.md },
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
});
