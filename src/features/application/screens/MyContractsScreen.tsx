import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { Badge, Card, EmptyState, ProgressBar, SkeletonCardList, StatTile } from '../../../components/ui';
import { RHSColors, spacing, typography } from '../../../lib/theme';
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

/** Bốn cột mốc người dân đi qua: cọc → ký → đóng theo đợt → hoàn tất. */
const MILESTONES = ['Đặt cọc', 'Ký hợp đồng', 'Đóng theo đợt', 'Hoàn tất'];

const MILESTONE_BY_STATUS: Record<string, number> = {
  DEPOSIT_PENDING: 0,
  DEPOSIT_PAID: 1,
  CONTRACT_PENDING: 1,
  CONTRACT_SIGNED: 2,
  CONTRACTING: 2,
  INSTALLMENT_IN_PROGRESS: 2,
  PARTIALLY_PAID: 2,
  PAID: 3,
  FULLY_PAID: 3,
  FINALIZED: 3,
};

const milestoneIndex = (status: string) =>
  MILESTONE_BY_STATUS[String(status || '').toUpperCase()] ?? 0;

const isDone = (status: string) => milestoneIndex(status) >= 3;

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

  const summary = useMemo(
    () => ({
      total: items.length,
      inProgress: items.filter((a) => !isDone(a.applicationStatus)).length,
      done: items.filter((a) => isDone(a.applicationStatus)).length,
    }),
    [items],
  );

  const renderItem = ({ item }: { item: ApplicationSummary }) => {
    const st = getStatusConfig(item.applicationStatus);
    const step = milestoneIndex(item.applicationStatus);
    const progress = (step + 1) / MILESTONES.length;

    return (
      <Card
        style={styles.card}
        accentColor={st.dotColor}
        onPress={() =>
          navigation.navigate('ApplicationDetail', { applicationId: item.applicationId })
        }
      >
        <View style={styles.cardHead}>
          <View style={styles.docIcon}>
            <Feather name="file-text" size={18} color={RHSColors.blue700} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.project} numberOfLines={2}>
              {item.projectName || 'Dự án'}
            </Text>
            <Text style={styles.meta}>
              Hồ sơ #{(item.applicationId || '').slice(0, 8).toUpperCase()}
              {item.applicantFullName ? ` · ${item.applicantFullName}` : ''}
            </Text>
          </View>
        </View>

        <Badge label={st.label} backgroundColor={st.bg} color={st.textColor} />

        <ProgressBar
          value={progress}
          label={MILESTONES[step]}
          valueLabel={`Bước ${step + 1}/${MILESTONES.length}`}
          colors={[st.dotColor, st.textColor]}
        />

        <View style={styles.milestoneRow}>
          {MILESTONES.map((label, i) => (
            <View key={label} style={styles.milestone}>
              <View
                style={[
                  styles.milestoneDot,
                  i <= step && { backgroundColor: st.dotColor, borderColor: st.dotColor },
                ]}
              >
                {i < step && <Feather name="check" size={9} color={RHSColors.white} />}
              </View>
              <Text
                style={[styles.milestoneLabel, i <= step && { color: RHSColors.text, fontWeight: '700' }]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.ctaRow}>
          <Text style={styles.cta}>Xem / ký hợp đồng · thanh toán</Text>
          <Feather name="chevron-right" size={18} color={RHSColors.blue700} />
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Hợp đồng"
        hero
        subtitle="Đợt 1 (cọc) → ký hợp đồng → Đợt 2–6"
        onBack={() => navigation.goBack()}
      >
        <View style={styles.statRow}>
          <StatTile onDark icon="file-text" value={loading ? '—' : summary.total} label="Hồ sơ" />
          <StatTile
            onDark
            icon="loader"
            value={loading ? '—' : summary.inProgress}
            label="Đang xử lý"
          />
          <StatTile
            onDark
            icon="check-circle"
            value={loading ? '—' : summary.done}
            label="Hoàn tất"
          />
        </View>
      </ScreenHeader>

      {loading ? (
        <View style={styles.list}>
          <SkeletonCardList count={3} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.applicationId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="file-text"
              title="Chưa có hồ sơ ở bước hợp đồng"
              description="Hồ sơ xuất hiện tại đây khi bạn trúng bốc thăm hoặc được cấp suất, bắt đầu từ Đợt 1 (cọc)."
            />
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
  statRow: { flexDirection: 'row', gap: spacing.sm },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
  card: { marginBottom: spacing.md, gap: spacing.md },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  docIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: RHSColors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  project: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text },
  meta: { ...typography.caption, color: RHSColors.textMuted, marginTop: 2 },
  milestoneRow: { flexDirection: 'row', gap: spacing.xs },
  milestone: { flex: 1, alignItems: 'center', gap: spacing.xs },
  milestoneDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: RHSColors.grey300,
    backgroundColor: RHSColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneLabel: {
    ...typography.caption,
    fontSize: 10,
    color: RHSColors.textMuted,
    textAlign: 'center',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: RHSColors.grey100,
  },
  cta: { ...typography.caption, fontWeight: '700', color: RHSColors.blue700 },
});
