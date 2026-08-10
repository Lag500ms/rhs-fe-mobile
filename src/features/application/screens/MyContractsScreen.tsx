import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { RHSColors, borderRadius, spacing, typography } from '../../../lib/theme';
import { housingApplicationApi } from '../api/housingApplicationApi';
import type { ApplicationSummary } from '../types/application';
import { getStatusConfig } from '../utils/statusConfig';

const CONTRACT_STATUSES = new Set([
  'DEPOSIT_PENDING',
  'CONTRACT_PENDING',
  'CONTRACT_SIGNED',
  'DEPOSIT_PAID',
  'INSTALLMENT_IN_PROGRESS',
  'CONTRACTING',
  'PARTIALLY_PAID',
  'PAID',
  'FINALIZED',
  'FULLY_PAID',
]);

export const MyContractsScreen = () => {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await housingApplicationApi.getMyApplications();
      const apps = data.items || [];
      setItems(
        apps.filter((a) => CONTRACT_STATUSES.has(String(a.applicationStatus || '').toUpperCase())),
      );
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || err?.message || 'Không tải được hợp đồng.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  const renderItem = ({ item }: { item: ApplicationSummary }) => {
    const st = getStatusConfig(item.applicationStatus);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('ApplicationDetail', { applicationId: item.applicationId })
        }
        activeOpacity={0.85}
      >
        <View style={styles.cardHead}>
          <Feather name="file-text" size={18} color={RHSColors.blue700} />
          <Text style={styles.project} numberOfLines={2}>
            {item.projectName || 'Dự án'}
          </Text>
        </View>
        <Text style={styles.meta}>
          Hồ sơ #{(item.applicationId || '').slice(0, 8).toUpperCase()}
          {item.applicantFullName ? ` · ${item.applicantFullName}` : ''}
        </Text>
        <View style={[styles.badge, { backgroundColor: st.bg }]}>
          <Text style={[styles.badgeText, { color: st.textColor }]}>{st.label}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cta}>Xem / ký hợp đồng · thanh toán</Text>
          <Feather name="chevron-right" size={18} color={RHSColors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Hợp đồng" onBack={() => navigation.goBack()} isWhite />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.applicationId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.hint}>
              {items.length} hồ sơ ở bước cọc / hợp đồng / thanh toán theo đợt. Chọn hồ sơ để tiếp tục
              (Đợt 1 → ký HĐ → Đợt 2–6).
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="inbox" size={48} color={RHSColors.textMuted} />
              <Text style={styles.emptyText}>
                Chưa có hồ sơ ở bước cọc / hợp đồng. Hồ sơ xuất hiện khi trúng hoặc được cấp suất
                (Đợt 1 → ký → thanh toán theo tiến độ).
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              colors={[RHSColors.blue700]}
              tintColor={RHSColors.blue700}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.xl, paddingBottom: spacing.xxl },
  hint: { ...typography.caption, color: RHSColors.textMuted, marginBottom: spacing.md },
  card: {
    backgroundColor: RHSColors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  project: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text, flex: 1 },
  meta: { ...typography.caption, color: RHSColors.textMuted, marginTop: spacing.sm },
  badge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  badgeText: { ...typography.caption, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  cta: { ...typography.caption, fontWeight: '600', color: RHSColors.blue700 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyText: {
    ...typography.body,
    color: RHSColors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
