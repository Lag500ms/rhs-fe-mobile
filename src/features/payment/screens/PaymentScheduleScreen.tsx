import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { RHSColors, borderRadius, spacing, typography } from '../../../lib/theme';
import { paymentApi } from '../api/paymentApi';
import { InstallmentPhase, InstallmentSummary } from '../types/payment';
import { housingApplicationApi } from '../../application/api/housingApplicationApi';
import { isPaymentSuccessStatus } from '../../../lib/depositDeadline';
import { isContractSignedForInstallments } from '../../application/utils/depositPipeline';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

/** Đồng bộ nhãn / mô tả đợt với web + BE PaymentMilestoneConstants.GetDisplayName */
const PHASE_COPY: Record<
  number,
  { short: string; title: string; description: string }
> = {
  1: {
    short: 'Cọc',
    title: 'Đợt 1 — Cọc',
    description: '10% giá trị căn khi trúng bốc thăm / cấp nhà.',
  },
  2: {
    short: 'Sau ký HĐ',
    title: 'Đợt 2 — Sau ký hợp đồng',
    description: '20% giá trị căn khi ký hợp đồng mua bán chính thức.',
  },
  3: {
    short: 'Xây thô',
    title: 'Đợt 3 — Xây thô',
    description: '20% giá trị căn khi hoàn thành xây thô.',
  },
  4: {
    short: 'Cất nóc',
    title: 'Đợt 4 — Cất nóc',
    description: '20% giá trị căn khi cất nóc tòa nhà.',
  },
  5: {
    short: 'Bàn giao',
    title: 'Đợt 5 — Bàn giao',
    description: '25% giá trị căn + 2% phí bảo trì khi bàn giao nhà & chìa khóa.',
  },
  6: {
    short: 'Sổ hồng',
    title: 'Đợt 6 — Sổ hồng',
    description: '5% còn lại khi nhận Giấy chứng nhận (Sổ hồng).',
  },
};

function phaseTitle(phase: InstallmentPhase): string {
  return PHASE_COPY[phase.phaseOrder]?.short
    || phase.phaseName?.trim()
    || `Đợt ${phase.phaseOrder}`;
}

function phaseTitleLong(phase: InstallmentPhase): string {
  return PHASE_COPY[phase.phaseOrder]?.title
    || phase.phaseName?.trim()
    || `Đợt ${phase.phaseOrder}`;
}

function phaseDescription(phase: InstallmentPhase): string {
  return PHASE_COPY[phase.phaseOrder]?.description
    || phase.note?.trim()
    || '';
}

function isPaid(status: string) {
  return String(status || '').toUpperCase() === 'PAID';
}

function isPayable(status: string) {
  const st = String(status || '').toUpperCase();
  return st === 'PENDING' || st === 'OVERDUE';
}

function isLocked(status: string) {
  return String(status || '').toUpperCase() === 'LOCKED';
}

/**
 * BE từng đánh Đợt 1 = PAID khi hồ sơ CONTRACT_PENDING (chưa VNPay).
 * Đợt 2 chỉ được trả sau khi ký HĐ.
 */
function pipelineStatus(
  phase: InstallmentPhase,
  appStatus: string | null,
  depositPaid: boolean,
): string {
  const st = String(phase.status || '').toUpperCase();
  if (phase.phaseOrder === 1 && !depositPaid && st === 'PAID') {
    return 'PENDING';
  }
  if (phase.phaseOrder === 2 && (!depositPaid || !isContractSignedForInstallments(appStatus))) {
    return 'LOCKED';
  }
  return st;
}

/** Chỉ số đợt “đang làm” — ưu tiên đến hạn; không thì đợt chưa trả đầu tiên. */
function resolveCurrentIndex(phases: InstallmentPhase[]): number {
  const payableIdx = phases.findIndex((p) => isPayable(p.status));
  if (payableIdx >= 0) return payableIdx;
  const firstOpen = phases.findIndex((p) => !isPaid(p.status) && String(p.status).toUpperCase() !== 'CANCELLED' && String(p.status).toUpperCase() !== 'CANCELED');
  if (firstOpen >= 0) return firstOpen;
  return Math.max(0, phases.length - 1);
}

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
  const [expanded, setExpanded] = useState(false);
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [depositPaid, setDepositPaid] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [data, app, payRes] = await Promise.all([
        paymentApi.getInstallments(applicationId),
        housingApplicationApi.getApplicationDetail(applicationId).catch(() => null),
        paymentApi.getMyPayments().catch(() => null),
      ]);
      setSummary(data);
      setAppStatus(app?.applicationStatus ?? null);
      const paid = !!(
        payRes?.success &&
        payRes.data?.some(
          (p) => p.applicationId === applicationId && isPaymentSuccessStatus(p.status),
        )
      );
      setDepositPaid(paid);
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

  const phases = useMemo(() => {
    if (!summary?.phases?.length) return [];
    return summary.phases
      .slice()
      .sort((a, b) => a.phaseOrder - b.phaseOrder)
      .map((p) => {
        const status = pipelineStatus(p, appStatus, depositPaid);
        return {
          ...p,
          status,
          paidAt: status === 'PAID' ? p.paidAt : null,
        };
      });
  }, [summary, appStatus, depositPaid]);

  const currentIdx = useMemo(() => resolveCurrentIndex(phases), [phases]);
  const current = phases[currentIdx];
  const history = useMemo(() => phases.filter((p) => isPaid(p.status)), [phases]);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const handlePay = async (phase: InstallmentPhase) => {
    const st = String(phase.status || '').toUpperCase();
    if (st === 'LOCKED') {
      Alert.alert(
        'Chưa tới lúc đóng',
        phase.phaseOrder === 2
          ? 'Khoản này mở sau khi bạn đóng cọc Đợt 1 và ký hợp đồng.'
          : 'Khoản này mở khi chủ đầu tư thông báo theo tiến độ xây dựng.',
      );
      return;
    }
    if (st !== 'PENDING' && st !== 'OVERDUE') return;
    setPayingId(phase.id);
    try {
      const result = phase.phaseOrder === 1
        ? await paymentApi.createPaymentUrl(applicationId)
        : await paymentApi.payInstallment(phase.id);
      if (result.success && result.data?.paymentUrl) {
        navigation.navigate('PaymentWebView', {
          paymentUrl: result.data.paymentUrl,
          orderId: result.data.orderId,
          applicationId,
          projectName: projectName || '',
          amount: phase.amount,
          phaseLabel: phaseTitleLong(phase),
        });
      } else {
        Alert.alert('Lỗi', result.message || 'Không tạo được URL thanh toán.');
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || e?.message || 'Không thanh toán được khoản này.');
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

          {!summary || phases.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="calendar" size={40} color={RHSColors.grey400} />
              <Text style={styles.emptyTitle}>Chưa có lịch đóng tiền</Text>
              <Text style={styles.emptyDesc}>
                Lịch xuất hiện sau khi chủ đầu tư cấp suất nhà. Khi đó bạn đóng cọc, rồi ký hợp đồng.
              </Text>
            </View>
          ) : (
            <>
              {/* Thanh ngang tiến độ */}
              <TouchableOpacity
                style={styles.progressCard}
                onPress={toggleExpand}
                activeOpacity={0.9}
              >
                <View style={styles.progressHead}>
                  <Text style={styles.progressEyebrow}>Tiến độ đóng tiền</Text>
                  <Feather
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={RHSColors.textMuted}
                  />
                </View>

                <View style={styles.barTrack}>
                  {phases.map((phase, idx) => {
                    const paid = isPaid(phase.status);
                    const active = idx === currentIdx && !paid;
                    return (
                      <View
                        key={phase.id}
                        style={[
                          styles.barSeg,
                          paid && styles.barSegPaid,
                          active && styles.barSegActive,
                          idx === 0 && styles.barSegFirst,
                          idx === phases.length - 1 && styles.barSegLast,
                        ]}
                      />
                    );
                  })}
                </View>

                <View style={styles.barLabels}>
                  {phases.map((phase, idx) => (
                    <Text
                      key={`lbl-${phase.id}`}
                      style={[
                        styles.barLabel,
                        idx === currentIdx && styles.barLabelActive,
                        isPaid(phase.status) && styles.barLabelDone,
                      ]}
                      numberOfLines={1}
                    >
                      {phaseTitle(phase)}
                    </Text>
                  ))}
                </View>

                {current ? (
                  <Text style={styles.nowLine}>
                    {isPaid(current.status)
                      ? 'Đã hoàn tất các khoản trên lịch'
                      : isPayable(current.status)
                        ? `Đang tới: ${phaseTitleLong(current)} · ${formatVnd(current.amount)}`
                        : isLocked(current.status)
                          ? `Tiếp theo: ${phaseTitleLong(current)} (chưa mở)`
                          : `Hiện tại: ${phaseTitleLong(current)}`}
                  </Text>
                ) : null}

                <Text style={styles.tapHint}>
                  {expanded ? 'Thu gọn chi tiết các đợt' : 'Chạm để xem từng đợt thanh toán'}
                </Text>
              </TouchableOpacity>

              {/* Expand: toàn bộ đợt + mô tả (giống web) */}
              {expanded && (
                <View style={styles.journeyCard}>
                  <Text style={styles.sectionTitle}>Các đợt thanh toán</Text>
                  {phases.map((phase, idx) => {
                    const paid = isPaid(phase.status);
                    const payable = isPayable(phase.status);
                    const locked = isLocked(phase.status);
                    const isCurrent = idx === currentIdx && !paid;
                    const desc = phaseDescription(phase);
                    return (
                      <View
                        key={phase.id}
                        style={[styles.journeyRow, isCurrent && payable && styles.journeyRowCurrent]}
                      >
                        <View style={styles.journeyRail}>
                          <View
                            style={[
                              styles.journeyDot,
                              paid && styles.journeyDotPaid,
                              payable && styles.journeyDotActive,
                              locked && styles.journeyDotLocked,
                            ]}
                          >
                            <Text style={styles.journeyDotText}>{paid ? '✓' : phase.phaseOrder}</Text>
                          </View>
                          {idx < phases.length - 1 && <View style={styles.journeyLine} />}
                        </View>
                        <View style={styles.journeyBody}>
                          <Text style={styles.journeyName}>{phaseTitleLong(phase)}</Text>
                          {desc ? <Text style={styles.journeyDesc}>{desc}</Text> : null}
                          <Text style={styles.journeyMeta}>
                            {formatVnd(phase.amount)}
                            {paid && phase.paidAt ? ` · Đã đóng ${formatDate(phase.paidAt)}` : ''}
                            {payable ? ' · Đến hạn đóng' : ''}
                            {locked ? ' · Chưa mở' : ''}
                          </Text>
                          {payable && (
                            <TouchableOpacity
                              style={styles.payBtn}
                              onPress={() => handlePay(phase)}
                              disabled={payingId === phase.id}
                              activeOpacity={0.9}
                            >
                              {payingId === phase.id ? (
                                <ActivityIndicator color="#fff" />
                              ) : (
                                <Text style={styles.payBtnText}>Thanh toán</Text>
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* CTA nhanh nếu chưa expand nhưng có khoản đến hạn */}
              {!expanded && current && isPayable(current.status) && (
                <TouchableOpacity
                  style={styles.payBtnLarge}
                  onPress={() => handlePay(current)}
                  disabled={payingId === current.id}
                  activeOpacity={0.9}
                >
                  {payingId === current.id ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Feather name="credit-card" size={16} color="#fff" />
                      <Text style={styles.payBtnText}>
                        Thanh toán {formatVnd(current.amount)}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Lịch sử */}
              <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Lịch sử thanh toán</Text>
              {history.length === 0 ? (
                <Text style={styles.historyEmpty}>Chưa có khoản nào đã đóng.</Text>
              ) : (
                history.map((phase) => (
                  <View key={`h-${phase.id}`} style={styles.historyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyName}>{phaseTitleLong(phase)}</Text>
                      <Text style={styles.historyMeta}>Đã đóng · {formatDate(phase.paidAt)}</Text>
                    </View>
                    <Text style={styles.historyAmount}>{formatVnd(phase.amount)}</Text>
                  </View>
                ))
              )}

              <View style={styles.summaryFoot}>
                <Text style={styles.summaryFootText}>
                  Đã đóng {formatVnd(summary.totalPaid)} / {formatVnd(summary.totalAmount)}
                </Text>
              </View>
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
  emptyDesc: {
    ...typography.caption,
    color: RHSColors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },

  progressCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: RHSColors.border,
    padding: spacing.lg,
  },
  progressHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  progressEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: RHSColors.textMuted,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  barTrack: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    gap: 3,
    backgroundColor: 'transparent',
  },
  barSeg: {
    flex: 1,
    backgroundColor: RHSColors.grey200,
    borderRadius: 3,
  },
  barSegFirst: {},
  barSegLast: {},
  barSegPaid: { backgroundColor: RHSColors.green600 },
  barSegActive: { backgroundColor: RHSColors.blue700 },
  barLabels: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 3,
  },
  barLabel: {
    flex: 1,
    fontSize: 9,
    color: RHSColors.textMuted,
    textAlign: 'center',
  },
  barLabelActive: { color: RHSColors.blue700, fontWeight: '700' },
  barLabelDone: { color: RHSColors.green700 },
  nowLine: {
    marginTop: spacing.md,
    fontSize: 14,
    fontWeight: '700',
    color: RHSColors.text,
    lineHeight: 20,
  },
  tapHint: {
    marginTop: 6,
    fontSize: 12,
    color: RHSColors.textMuted,
  },

  journeyCard: {
    marginTop: spacing.md,
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: RHSColors.border,
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: RHSColors.text,
    marginBottom: spacing.sm,
  },
  journeyRow: { flexDirection: 'row', minHeight: 48 },
  journeyRowCurrent: {
    backgroundColor: '#F5F9FC',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: borderRadius.md,
  },
  journeyRail: { width: 28, alignItems: 'center' },
  journeyDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: RHSColors.grey300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyDotPaid: { backgroundColor: RHSColors.green600 },
  journeyDotActive: { backgroundColor: RHSColors.blue700 },
  journeyDotLocked: { backgroundColor: RHSColors.grey300 },
  journeyDotText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  journeyLine: {
    flex: 1,
    width: 2,
    backgroundColor: RHSColors.grey200,
    marginVertical: 2,
    minHeight: 12,
  },
  journeyBody: { flex: 1, paddingLeft: 10, paddingBottom: 14 },
  journeyName: { fontSize: 14, fontWeight: '600', color: RHSColors.text },
  journeyDesc: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: RHSColors.textMuted,
  },
  journeyMeta: { marginTop: 4, fontSize: 12, color: RHSColors.textMuted },

  payBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: RHSColors.red600,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: 'center',
  },
  payBtnLarge: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: RHSColors.red600,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  payBtnText: { ...typography.button, color: '#fff', fontSize: 14 },

  historyEmpty: {
    ...typography.caption,
    color: RHSColors.textMuted,
    marginBottom: spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: RHSColors.border,
  },
  historyName: { fontSize: 13, fontWeight: '600', color: RHSColors.text },
  historyMeta: { fontSize: 11, color: RHSColors.textMuted, marginTop: 2 },
  historyAmount: { fontSize: 13, fontWeight: '700', color: RHSColors.green700 },

  summaryFoot: { marginTop: spacing.lg },
  summaryFootText: { fontSize: 12, color: RHSColors.textMuted, textAlign: 'center' },
});
