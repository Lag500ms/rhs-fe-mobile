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
import { Badge, Card, EmptyState, SkeletonCardList, StatTile } from '../../../components/ui';
import type { BadgeTone } from '../../../components/ui';
import { RHSColors, spacing, typography } from '../../../lib/theme';
import { paymentApi } from '../api/paymentApi';
import type { PaymentInfo } from '../types/payment';

const PAYMENT_STATUS_VI: Record<string, string> = {
  Pending: 'Chờ thanh toán',
  PENDING: 'Chờ thanh toán',
  Success: 'Thành công',
  SUCCESS: 'Thành công',
  Paid: 'Đã thanh toán',
  PAID: 'Đã thanh toán',
  Failed: 'Thất bại',
  FAILED: 'Thất bại',
  Cancelled: 'Đã hủy',
  CANCELLED: 'Đã hủy',
  Canceled: 'Đã hủy',
};

type StatusMeta = {
  label: string;
  tone: BadgeTone;
  accent: string;
  icon: keyof typeof Feather.glyphMap;
  settled: boolean;
};

function statusMeta(status: string): StatusMeta {
  const key = String(status || '');
  const upper = key.toUpperCase();
  const label = PAYMENT_STATUS_VI[key] ?? PAYMENT_STATUS_VI[upper] ?? 'Không rõ';

  if (upper === 'SUCCESS' || upper === 'PAID') {
    return { label, tone: 'success', accent: RHSColors.green600, icon: 'check-circle', settled: true };
  }
  if (upper === 'FAILED' || upper === 'CANCELLED' || upper === 'CANCELED') {
    return { label, tone: 'danger', accent: RHSColors.red600, icon: 'x-circle', settled: false };
  }
  return { label, tone: 'warning', accent: RHSColors.amber600, icon: 'clock', settled: false };
}

const formatVnd = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const compactVnd = (amount: number) => {
  const v = amount || 0;
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1).replace('.0', '')} tỷ`;
  if (v >= 1_000_000) return `${Math.round(v / 1_000_000)} tr`;
  if (v >= 1_000) return `${Math.round(v / 1_000)} k`;
  return String(v);
};

export const MyPaymentsScreen = () => {
  const navigation = useNavigation<any>();
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await paymentApi.getMyPayments();
      setPayments(Array.isArray(result?.data) ? result.data : []);
    } catch (err: any) {
      Alert.alert(
        'Lỗi',
        err?.response?.data?.message || err?.message || 'Không tải được lịch sử thanh toán.',
      );
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

  const summary = useMemo(() => {
    const settled = payments.filter((p) => statusMeta(p.status).settled);
    const pending = payments.filter((p) => {
      const upper = String(p.status || '').toUpperCase();
      return upper === 'PENDING';
    });
    return {
      total: settled.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      count: payments.length,
      pending: pending.length,
    };
  }, [payments]);

  const openPayment = (p: PaymentInfo) => {
    if (p.applicationId) {
      navigation.navigate('ApplicationDetail', { applicationId: p.applicationId });
    }
  };

  const renderItem = ({ item }: { item: PaymentInfo }) => {
    const st = statusMeta(item.status);
    const canOpen = !!item.applicationId;
    return (
      <Card
        style={styles.card}
        accentColor={st.accent}
        onPress={canOpen ? () => openPayment(item) : undefined}
      >
        <View style={styles.cardHead}>
          <View style={[styles.statusIcon, { backgroundColor: `${st.accent}18` }]}>
            <Feather name={st.icon} size={18} color={st.accent} />
          </View>
          <View style={styles.cardHeadBody}>
            <Text style={styles.amount}>{formatVnd(Number(item.amount))}</Text>
            <Text style={styles.orderId} numberOfLines={1}>
              {item.orderId}
            </Text>
          </View>
          <Badge label={st.label} tone={st.tone} />
        </View>

        {!!item.orderInfo && (
          <Text style={styles.orderInfo} numberOfLines={2}>
            {item.orderInfo}
          </Text>
        )}

        <View style={styles.metaRow}>
          <Feather name="clock" size={13} color={RHSColors.textMuted} />
          <Text style={styles.meta}>
            {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '—'}
          </Text>
          {!!item.slotCode && (
            <>
              <View style={styles.metaDot} />
              <Text style={styles.meta}>Suất {item.slotCode}</Text>
            </>
          )}
        </View>

        {canOpen && (
          <View style={styles.ctaRow}>
            <Text style={styles.cta}>
              Hồ sơ #{String(item.applicationId).slice(0, 8).toUpperCase()}
            </Text>
            <Feather name="chevron-right" size={18} color={RHSColors.blue700} />
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Thanh toán"
        hero
        subtitle="Lịch sử giao dịch VNPay của bạn"
        onBack={() => navigation.goBack()}
      >
        <View style={styles.statRow}>
          <StatTile
            onDark
            icon="check-circle"
            value={loading ? '—' : compactVnd(summary.total)}
            label="Đã thanh toán"
          />
          <StatTile
            onDark
            icon="list"
            value={loading ? '—' : summary.count}
            label="Tổng giao dịch"
          />
          <StatTile
            onDark
            icon="clock"
            value={loading ? '—' : summary.pending}
            label="Đang chờ"
          />
        </View>
      </ScreenHeader>

      {loading ? (
        <View style={styles.list}>
          <SkeletonCardList count={4} />
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.orderId || item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="credit-card"
              title="Chưa có giao dịch nào"
              description="Thanh toán Đợt 1 (cọc) và các đợt sau được thực hiện từ chi tiết hồ sơ hoặc mục Hợp đồng."
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
  card: { marginBottom: spacing.md, gap: spacing.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeadBody: { flex: 1 },
  amount: { ...typography.h3, fontWeight: '800', color: RHSColors.text },
  orderId: { ...typography.caption, color: RHSColors.textMuted, marginTop: 2 },
  orderInfo: { ...typography.bodySmall, color: RHSColors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: RHSColors.textMuted,
    marginHorizontal: spacing.xs,
  },
  meta: { ...typography.caption, color: RHSColors.textMuted },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: RHSColors.grey100,
  },
  cta: { ...typography.caption, fontWeight: '700', color: RHSColors.blue700 },
});
