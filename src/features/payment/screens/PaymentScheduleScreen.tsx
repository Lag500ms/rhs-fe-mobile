import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { RHSColors, borderRadius, shadows, spacing, typography } from '../../../lib/theme';
import { paymentApi } from '../api/paymentApi';
import { InstallmentPhase, InstallmentSummary } from '../types/payment';

const formatVnd = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch {
    return value;
  }
};

const statusMeta = (status: string) => {
  switch (status) {
    case 'PAID':
      return { label: 'Đã thanh toán', color: RHSColors.green700, bg: RHSColors.green50 };
    case 'OVERDUE':
      return { label: 'Quá hạn', color: RHSColors.red700, bg: RHSColors.red50 };
    case 'CANCELLED':
      return { label: 'Đã hủy', color: RHSColors.grey500, bg: RHSColors.grey100 };
    default:
      return { label: 'Chờ thanh toán', color: RHSColors.amber700, bg: RHSColors.amber50 };
  }
};

export const PaymentScheduleScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { applicationId, projectName } = route.params as {
    applicationId: string;
    projectName?: string;
  };

  const [summary, setSummary] = useState<InstallmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await paymentApi.getInstallments(applicationId);
      setSummary(data);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 404) {
        setSummary(null);
      } else {
        Alert.alert('Lỗi', e?.response?.data?.message || e?.message || 'Không tải được lịch thanh toán.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [applicationId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handlePay = async (phase: InstallmentPhase) => {
    if (phase.status !== 'PENDING' && phase.status !== 'OVERDUE') return;
    setPayingId(phase.id);
    try {
      const result = await paymentApi.payInstallment(phase.id);
      if (result.success && result.data?.paymentUrl) {
        navigation.navigate('PaymentWebView', {
          paymentUrl: result.data.paymentUrl,
          orderId: result.data.orderId,
          applicationId,
        });
      } else {
        Alert.alert('Lỗi', result.message || 'Không tạo được URL thanh toán.');
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || e?.message || 'Không thanh toán được đợt này.');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Lịch thanh toán" isWhite />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[RHSColors.blue700]} />
          }
        >
          {projectName ? <Text style={styles.project}>{projectName}</Text> : null}

          {!summary || summary.phases.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="calendar" size={40} color={RHSColors.grey400} />
              <Text style={styles.emptyTitle}>Chưa có lịch đóng tiền</Text>
              <Text style={styles.emptyDesc}>
                Lịch thanh toán theo đợt sẽ xuất hiện sau khi hồ sơ trúng và được gán căn.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Tổng quan</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tổng cần đóng</Text>
                  <Text style={styles.summaryValue}>{formatVnd(summary.totalAmount)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Đã đóng</Text>
                  <Text style={[styles.summaryValue, { color: RHSColors.green700 }]}>
                    {formatVnd(summary.totalPaid)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Còn lại</Text>
                  <Text style={[styles.summaryValue, { color: RHSColors.red700 }]}>
                    {formatVnd(summary.totalRemaining)}
                  </Text>
                </View>
                <Text style={styles.phaseCount}>
                  {summary.paidPhases}/{summary.totalPhases} đợt đã thanh toán
                </Text>
                {!!summary.apartmentTypeName && (
                  <Text style={styles.aptMeta}>
                    {summary.apartmentTypeName}
                    {summary.apartmentArea ? ` · ${summary.apartmentArea} m²` : ''}
                  </Text>
                )}
              </View>

              {summary.phases
                .slice()
                .sort((a, b) => a.phaseOrder - b.phaseOrder)
                .map((phase) => {
                  const meta = statusMeta(phase.status);
                  const canPay = phase.status === 'PENDING' || phase.status === 'OVERDUE';
                  return (
                    <View key={phase.id} style={styles.phaseCard}>
                      <View style={styles.phaseHeader}>
                        <Text style={styles.phaseName}>
                          Đợt {phase.phaseOrder}: {phase.phaseName}
                        </Text>
                        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.amount}>{formatVnd(phase.amount)}</Text>
                      <Text style={styles.due}>Hạn: {formatDate(phase.dueDate)}</Text>
                      {phase.paidAt ? (
                        <Text style={styles.due}>Đã đóng: {formatDate(phase.paidAt)}</Text>
                      ) : (
                        <Text style={styles.due}>
                          {phase.remainingDays >= 0
                            ? `Còn ${phase.remainingDays} ngày`
                            : `Quá hạn ${Math.abs(phase.remainingDays)} ngày`}
                        </Text>
                      )}
                      {canPay && (
                        <TouchableOpacity
                          style={styles.payBtn}
                          onPress={() => handlePay(phase)}
                          disabled={payingId === phase.id}
                          activeOpacity={0.9}
                        >
                          {payingId === phase.id ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <>
                              <Feather name="credit-card" size={16} color="#fff" />
                              <Text style={styles.payBtnText}>Thanh toán qua VNPay</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  project: { ...typography.h3, color: RHSColors.text, marginBottom: spacing.md },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text },
  emptyDesc: { ...typography.caption, color: RHSColors.textMuted, textAlign: 'center', lineHeight: 18 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: RHSColors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  summaryTitle: { ...typography.bodySmall, fontWeight: '700', marginBottom: spacing.sm, color: RHSColors.text },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { ...typography.bodySmall, color: RHSColors.textMuted },
  summaryValue: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text },
  phaseCount: { ...typography.caption, color: RHSColors.blue700, marginTop: spacing.sm, fontWeight: '600' },
  aptMeta: { ...typography.caption, color: RHSColors.textMuted, marginTop: 4 },
  phaseCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: RHSColors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  phaseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  phaseName: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm },
  badgeText: { fontSize: 11, fontWeight: '700' },
  amount: { fontSize: 18, fontWeight: '800', color: RHSColors.text, marginTop: spacing.sm },
  due: { ...typography.caption, color: RHSColors.textMuted, marginTop: 4 },
  payBtn: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: RHSColors.red600,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  payBtnText: { ...typography.button, color: '#fff', fontSize: 14 },
});
