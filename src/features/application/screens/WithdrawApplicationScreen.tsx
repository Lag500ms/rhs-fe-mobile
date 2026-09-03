import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { appAlert } from '../../../lib/appDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { RHSColors, borderRadius, shadows, spacing, typography } from '../../../lib/theme';
import { housingApplicationApi } from '../api/housingApplicationApi';
import { paymentApi } from '../../payment/api/paymentApi';
import type { ContractCancellationPreview } from '../../payment/types/payment';

const APP_REASONS = [
  'Tôi đã tìm được nhà ở khác phù hợp',
  'Tôi nộp nhầm dự án',
  'Điều kiện tài chính thay đổi',
  'Thông tin cá nhân/hộ gia đình cần điều chỉnh',
  'Lý do khác',
];

const CONTRACT_REASONS = [
  'Gặp khó khăn tài chính, không thể tiếp tục đóng tiền',
  'Thay đổi nhu cầu nhà ở',
  'Lý do gia đình / sức khỏe',
  'Lý do khác',
];

const formatVnd = (amount?: number | null) =>
  `${Math.round(amount || 0).toLocaleString('vi-VN')} VNĐ`;

export const WithdrawApplicationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { applicationId, projectName, mode } = route.params as {
    applicationId: string;
    projectName?: string;
    mode?: 'application' | 'contract';
  };
  const isContract = mode === 'contract';
  const reasons = isContract ? CONTRACT_REASONS : APP_REASONS;

  const [selected, setSelected] = useState<number | null>(null);
  const [otherReason, setOtherReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<ContractCancellationPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(isContract);
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  const isOther = selected === reasons.length - 1;

  const finalReason = useMemo(() => {
    if (selected === null) return '';
    return isOther ? otherReason.trim() : reasons[selected];
  }, [selected, isOther, otherReason, reasons]);

  useEffect(() => {
    if (!isContract) return;
    let cancelled = false;
    setLoadingPreview(true);
    paymentApi
      .getCancellationPreview(applicationId)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((e: any) => {
        if (!cancelled) {
          appAlert(
            'Lỗi',
            e?.response?.data?.message || e?.message || 'Không tính được bảng hoàn tiền.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId, isContract]);

  const canSubmit =
    finalReason.length > 0 &&
    !submitting &&
    (!isContract || (!loadingPreview && preview?.canCancel !== false));

  const doWithdraw = async () => {
    setSubmitting(true);
    try {
      if (isContract) {
        await paymentApi.requestCancellation(applicationId, {
          reason: finalReason,
          bankName: bankName.trim() || undefined,
          bankAccountNumber: bankAccountNumber.trim() || undefined,
          accountHolderName: accountHolderName.trim() || undefined,
        });
        appAlert(
          'Đã gửi đơn',
          'Đơn xin ngừng thanh toán đã gửi tới chủ đầu tư. Tiền cọc đợt đầu sẽ bị trừ nếu đơn được chấp thuận.',
          [{ text: 'Đồng ý', onPress: () => navigation.goBack() }],
        );
      } else {
        await housingApplicationApi.cancelApplication(applicationId, finalReason);
        appAlert(
          'Đã hủy hồ sơ',
          'Hồ sơ của bạn đã được hủy thành công.',
          [{ text: 'Đồng ý', onPress: () => navigation.goBack() }],
        );
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        (isContract
          ? 'Không gửi được đơn xin ngừng thanh toán.'
          : 'Không thể hủy hồ sơ. Vui lòng thử lại.');
      appAlert('Lỗi', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = () => {
    if (!canSubmit) return;
    appAlert(
      isContract ? 'Xác nhận xin ngừng thanh toán' : 'Xác nhận hủy hồ sơ',
      isContract
        ? 'Chủ đầu tư sẽ xét đơn. Nếu chấp thuận, bạn mất toàn bộ tiền cọc đợt đầu; các khoản đã đóng sau đó được hoàn sau khi trừ lãi phạt (nếu có).'
        : 'Sau khi hủy, hồ sơ sẽ chuyển sang trạng thái "Đã hủy" và không thể tiếp tục. Nếu đang giữ suất/căn, hệ thống sẽ hoàn lại. Bạn có chắc chắn?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: isContract ? 'Gửi đơn' : 'Hủy hồ sơ',
          style: 'destructive',
          onPress: doWithdraw,
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title={isContract ? 'Xin ngừng thanh toán' : 'Hủy hồ sơ'} isWhite />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.warnCard}>
          <Feather name="alert-triangle" size={18} color={RHSColors.red600} />
          <Text style={styles.warnText}>
            {isContract
              ? `Bạn đang xin dừng mua nhà${projectName ? ` tại "${projectName}"` : ''}. Tiền cọc đợt đầu bị mất nếu chủ đầu tư chấp thuận.`
              : `Bạn đang yêu cầu hủy hồ sơ${projectName ? ` cho dự án "${projectName}"` : ''}. Thao tác này không thể hoàn tác.`}
          </Text>
        </View>

        {isContract && loadingPreview && (
          <View style={styles.previewLoading}>
            <ActivityIndicator color={RHSColors.blue700} />
            <Text style={styles.previewHint}>Đang tính bảng hoàn tiền…</Text>
          </View>
        )}

        {isContract && preview && (
          <View style={styles.previewCard}>
            <Text style={styles.sectionTitle}>Bảng kê phạt cọc & hoàn tiền</Text>
            {preview.apartmentUnitName ? (
              <Text style={styles.previewLine}>Căn: {preview.apartmentUnitName}</Text>
            ) : null}
            <Text style={styles.previewLine}>Tiền cọc (đợt 1) bị trừ: {formatVnd(preview.depositForfeited)}</Text>
            <Text style={styles.previewLine}>Đã đóng từ đợt 2 trở đi: {formatVnd(preview.phase2PlusPaidAmount)}</Text>
            <Text style={styles.previewLine}>Lãi phạt chưa thanh toán: {formatVnd(preview.totalUnpaidPenalty)}</Text>
            <Text style={styles.previewRefund}>Số tiền dự kiến hoàn: {formatVnd(preview.refundAmount)}</Text>
            {preview.overduePhasesCount >= 2 ? (
              <Text style={styles.previewWarn}>
                Đã quá hạn liên tiếp {preview.overduePhasesCount} đợt. Chủ đầu tư có thể cưỡng chế thu hồi căn.
              </Text>
            ) : null}
            {preview.message ? <Text style={styles.previewHint}>{preview.message}</Text> : null}
          </View>
        )}

        <Text style={styles.sectionTitle}>{isContract ? 'Lý do xin dừng' : 'Lý do hủy hồ sơ'}</Text>

        {reasons.map((reason, index) => {
          const active = selected === index;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.reasonRow, active && styles.reasonRowActive]}
              activeOpacity={0.8}
              onPress={() => setSelected(index)}
            >
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.reasonText, active && styles.reasonTextActive]}>{reason}</Text>
            </TouchableOpacity>
          );
        })}

        {isOther && (
          <TextInput
            style={styles.input}
            placeholder="Nhập lý do cụ thể..."
            placeholderTextColor={RHSColors.textMuted}
            value={otherReason}
            onChangeText={setOtherReason}
            multiline
            maxLength={300}
          />
        )}

        {isContract && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
              Tài khoản nhận hoàn tiền (nếu có)
            </Text>
            <TextInput
              style={styles.singleInput}
              placeholder="Chủ tài khoản"
              placeholderTextColor={RHSColors.textMuted}
              value={accountHolderName}
              onChangeText={setAccountHolderName}
            />
            <TextInput
              style={styles.singleInput}
              placeholder="Số tài khoản"
              placeholderTextColor={RHSColors.textMuted}
              keyboardType="number-pad"
              value={bankAccountNumber}
              onChangeText={setBankAccountNumber}
            />
            <TextInput
              style={styles.singleInput}
              placeholder="Ngân hàng"
              placeholderTextColor={RHSColors.textMuted}
              value={bankName}
              onChangeText={setBankName}
            />
          </>
        )}
      </ScrollView>

      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleConfirm}
          activeOpacity={0.9}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name={isContract ? 'send' : 'x-octagon'} size={18} color="#fff" />
          )}
          <Text style={styles.submitBtnText}>
            {isContract ? 'Gửi đơn xin ngừng thanh toán' : 'Xác nhận hủy hồ sơ'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.huge },

  warnCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: RHSColors.red50,
    borderWidth: 1,
    borderColor: RHSColors.red400,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  warnText: { ...typography.bodySmall, color: RHSColors.red700, flex: 1, lineHeight: 19 },

  sectionTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: RHSColors.text,
    marginBottom: spacing.sm,
  },

  previewLoading: { alignItems: 'center', gap: 8, marginBottom: spacing.lg },
  previewCard: {
    backgroundColor: RHSColors.white,
    borderWidth: 1,
    borderColor: RHSColors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: 4,
  },
  previewLine: { ...typography.caption, color: RHSColors.textSecondary, lineHeight: 18 },
  previewRefund: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.green700, marginTop: 6 },
  previewWarn: { ...typography.caption, color: RHSColors.red600, marginTop: 6, lineHeight: 18 },
  previewHint: { ...typography.caption, color: RHSColors.textMuted, marginTop: 4 },

  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: RHSColors.white,
    borderWidth: 1,
    borderColor: RHSColors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  reasonRowActive: { borderColor: RHSColors.blue700, backgroundColor: RHSColors.blue50 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: RHSColors.grey400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: RHSColors.blue700 },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: RHSColors.blue700 },
  reasonText: { ...typography.bodySmall, color: RHSColors.textSecondary, flex: 1 },
  reasonTextActive: { color: RHSColors.text, fontWeight: '600' },

  input: {
    backgroundColor: RHSColors.white,
    borderWidth: 1,
    borderColor: RHSColors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 90,
    textAlignVertical: 'top',
    ...typography.bodySmall,
    color: RHSColors.text,
    marginTop: spacing.xs,
  },
  singleInput: {
    backgroundColor: RHSColors.white,
    borderWidth: 1,
    borderColor: RHSColors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.bodySmall,
    color: RHSColors.text,
    marginBottom: spacing.sm,
  },

  bottomBar: {
    backgroundColor: RHSColors.white,
    borderTopWidth: 1,
    borderTopColor: RHSColors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    ...shadows.lg,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: RHSColors.red600,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    minHeight: 52,
    ...shadows.md,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { ...typography.button, color: '#fff' },
});
