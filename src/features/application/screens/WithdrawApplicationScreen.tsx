import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { RHSColors, borderRadius, shadows, spacing, typography } from '../../../lib/theme';
import { housingApplicationApi } from '../api/housingApplicationApi';

const REASONS = [
  'Tôi đã tìm được nhà ở khác phù hợp',
  'Tôi nộp nhầm dự án',
  'Điều kiện tài chính thay đổi',
  'Thông tin cá nhân/hộ gia đình cần điều chỉnh',
  'Lý do khác',
];

export const WithdrawApplicationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { applicationId, projectName } = route.params as {
    applicationId: string;
    projectName?: string;
  };

  const [selected, setSelected] = useState<number | null>(null);
  const [otherReason, setOtherReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOther = selected === REASONS.length - 1;

  const finalReason = useMemo(() => {
    if (selected === null) return '';
    return isOther ? otherReason.trim() : REASONS[selected];
  }, [selected, isOther, otherReason]);

  const canSubmit = finalReason.length > 0 && !submitting;

  const doWithdraw = async () => {
    setSubmitting(true);
    try {
      await housingApplicationApi.cancelApplication(applicationId, finalReason);
      Alert.alert(
        'Đã rút hồ sơ',
        'Hồ sơ của bạn đã được rút thành công.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Không thể rút hồ sơ. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = () => {
    if (!canSubmit) return;
    Alert.alert(
      'Xác nhận rút hồ sơ',
      'Sau khi rút, hồ sơ sẽ chuyển sang trạng thái "Đã hủy" và không thể tiếp tục. Bạn có chắc chắn?',
      [
        { text: 'Không', style: 'cancel' },
        { text: 'Rút hồ sơ', style: 'destructive', onPress: doWithdraw },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Rút hồ sơ" isWhite />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.warnCard}>
          <Feather name="alert-triangle" size={18} color={RHSColors.red600} />
          <Text style={styles.warnText}>
            Bạn đang yêu cầu rút hồ sơ
            {projectName ? ` cho dự án "${projectName}"` : ''}. Thao tác này không thể hoàn tác.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Lý do rút hồ sơ</Text>

        {REASONS.map((reason, index) => {
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
            <Feather name="x-octagon" size={18} color="#fff" />
          )}
          <Text style={styles.submitBtnText}>Xác nhận rút hồ sơ</Text>
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
