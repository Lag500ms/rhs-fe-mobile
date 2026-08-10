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

function statusMeta(status: string) {
  const key = String(status || '');
  const upper = key.toUpperCase();
  const ok = upper === 'SUCCESS' || upper === 'PAID';
  const bad = upper === 'FAILED' || upper === 'CANCELLED' || upper === 'CANCELED';
  return {
    label: PAYMENT_STATUS_VI[key] ?? PAYMENT_STATUS_VI[upper] ?? 'Không rõ',
    color: ok ? RHSColors.green700 : bad ? RHSColors.red700 : RHSColors.amber700,
    bg: ok ? RHSColors.green50 : bad ? RHSColors.red50 : RHSColors.amber50,
  };
}

const formatVnd = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

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

  const openPayment = (p: PaymentInfo) => {
    if (p.applicationId) {
      navigation.navigate('ApplicationDetail', { applicationId: p.applicationId });
    }
  };

  const renderItem = ({ item }: { item: PaymentInfo }) => {
    const st = statusMeta(item.status);
    const canOpen = !!item.applicationId;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openPayment(item)}
        activeOpacity={canOpen ? 0.85 : 1}
        disabled={!canOpen}
      >
        <View style={styles.cardHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderId}>{item.orderId}</Text>
            {!!item.orderInfo && (
              <Text style={styles.meta} numberOfLines={2}>
                {item.orderInfo}
              </Text>
            )}
          </View>
          <View style={[styles.badge, { backgroundColor: st.bg }]}>
            <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
        <Text style={styles.amount}>{formatVnd(Number(item.amount))}</Text>
        <Text style={styles.meta}>
          {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '—'}
          {item.applicationId
            ? ` · Hồ sơ #${item.applicationId.slice(0, 8).toUpperCase()}`
            : ''}
        </Text>
        {canOpen && (
          <View style={styles.row}>
            <Text style={styles.cta}>Mở hồ sơ liên quan</Text>
            <Feather name="chevron-right" size={18} color={RHSColors.textMuted} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Thanh toán" onBack={() => navigation.goBack()} isWhite />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.orderId || item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.hint}>Lịch sử giao dịch VNPay của bạn.</Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="credit-card" size={48} color={RHSColors.textMuted} />
              <Text style={styles.emptyText}>
                Chưa có giao dịch nào. Thanh toán Đợt 1 (cọc) và các đợt sau từ chi tiết hồ sơ hoặc
                mục Hợp đồng.
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
  orderId: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text },
  meta: { ...typography.caption, color: RHSColors.textMuted, marginTop: 4 },
  amount: { ...typography.body, fontWeight: '700', color: RHSColors.text, marginTop: spacing.sm },
  badge: {
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
