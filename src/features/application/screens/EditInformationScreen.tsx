import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BrandBar } from '../../../components/BrandBar';
import { RHSColors, borderRadius, typography } from '../../../lib/theme';
import { housingApplicationApi, ApplicationDetail } from '../api/housingApplicationApi';

const HOUSING_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'NO_HOUSE', label: 'Chưa có nhà ở' },
  { value: 'SMALL_HOUSE', label: 'Diện tích nhà ở dưới 15m²' },
];

function formatCurrency(value: string): string {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('vi-VN');
}

function parseCurrency(value: string): number {
  return Number(value.replace(/[^0-9]/g, '')) || 0;
}

function formatNumber(num: number): string {
  return num.toLocaleString('vi-VN');
}

export const EditInformationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { applicationId } = route.params;

  // Hide bottom tab bar
  useLayoutEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({ tabBarStyle: { display: 'none' } });
    }
    return () => {
      if (parent) {
        parent.setOptions({ tabBarStyle: undefined });
      }
    };
  }, [navigation]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Fields loaded from detail ──
  const [fullName, setFullName] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [currentResidence, setCurrentResidence] = useState('');
  const [sameAsPermanent, setSameAsPermanent] = useState(false);
  const [occupation, setOccupation] = useState('');
  const [workPlace, setWorkPlace] = useState('');
  const [housingStatus, setHousingStatus] = useState('');
  const [incomeDisplay, setIncomeDisplay] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing application detail
  useEffect(() => {
    (async () => {
      try {
        const detail: ApplicationDetail = await housingApplicationApi.getApplicationDetail(applicationId);
        setFullName(detail.fullName || '');
        setCitizenId(detail.citizenId || '');
        setPermanentAddress(detail.permanentAddress || '');
        setCurrentResidence(detail.currentResidence || '');
        setOccupation(detail.occupation || '');
        setWorkPlace(detail.workPlace || '');
        setHousingStatus(detail.housingStatus || '');
        if (detail.estimatedMonthlyIncome) {
          setIncomeDisplay(formatNumber(detail.estimatedMonthlyIncome));
        }
      } catch (e: any) {
        const msg = e?.response?.data?.message || 'Không thể tải thông tin hồ sơ.';
        Alert.alert('Lỗi', msg);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [applicationId]);

  // Sync currentResidence when checkbox is toggled
  useEffect(() => {
    if (sameAsPermanent && permanentAddress) {
      setCurrentResidence(permanentAddress);
      setErrors(prev => { const e = { ...prev }; delete e.currentResidence; return e; });
    } else if (!sameAsPermanent) {
      setCurrentResidence('');
    }
  }, [sameAsPermanent, permanentAddress]);

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    switch (field) {
      case 'currentResidence':
        if (!value.trim()) newErrors.currentResidence = 'Vui lòng nhập nơi ở hiện tại';
        else delete newErrors.currentResidence;
        break;
      case 'housingStatus':
        if (!value) newErrors.housingStatus = 'Vui lòng chọn thực trạng nhà ở';
        else delete newErrors.housingStatus;
        break;
      case 'income': {
        const num = parseCurrency(value);
        if (!value.trim()) newErrors.income = 'Vui lòng nhập thu nhập';
        else if (isNaN(num) || num <= 0) newErrors.income = 'Thu nhập không hợp lệ';
        else delete newErrors.income;
        break;
      }
    }
    setErrors(newErrors);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!currentResidence.trim()) newErrors.currentResidence = 'Vui lòng nhập nơi ở hiện tại';
    if (!housingStatus) newErrors.housingStatus = 'Vui lòng chọn thực trạng nhà ở';
    const incomeNum = parseCurrency(incomeDisplay);
    if (!incomeDisplay.trim()) newErrors.income = 'Vui lòng nhập thu nhập';
    else if (isNaN(incomeNum) || incomeNum <= 0) newErrors.income = 'Thu nhập không hợp lệ';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      await housingApplicationApi.updateApplication(applicationId, {
        currentResidence: currentResidence.trim(),
        occupation: occupation.trim() || undefined,
        workPlace: workPlace.trim() || undefined,
        housingStatus,
        estimatedMonthlyIncome: parseCurrency(incomeDisplay),
      });
      Alert.alert('Thành công', 'Thông tin hồ sơ đã được cập nhật.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Có lỗi xảy ra.';
      Alert.alert('Lỗi', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <BrandBar />

      {/* White header */}
      <View style={styles.whiteHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={RHSColors.blue700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa thông tin</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── IDENTITY INFO – LOCKED FROM eKYC ── */}
          <Text style={styles.sectionTitle}>Thông tin định danh</Text>
          <View style={styles.card}>
            <View style={styles.syncBadge}>
              <Feather name="check-circle" size={14} color={RHSColors.green600} />
              <Text style={styles.syncBadgeText}>
                Thông tin được đồng bộ từ Dữ liệu định danh eKYC
              </Text>
            </View>

            <Text style={styles.label}>Họ và tên</Text>
            <View style={styles.lockedInput}>
              <Feather name="user" size={16} color={RHSColors.textMuted} />
              <Text style={styles.lockedText}>{fullName || '—'}</Text>
            </View>

            <Text style={styles.label}>Số CCCD</Text>
            <View style={styles.lockedInput}>
              <Feather name="credit-card" size={16} color={RHSColors.textMuted} />
              <Text style={styles.lockedText}>{citizenId || '—'}</Text>
            </View>

            <Text style={styles.label}>Địa chỉ thường trú</Text>
            <View style={styles.lockedInput}>
              <Feather name="bookmark" size={16} color={RHSColors.textMuted} />
              <Text style={styles.lockedText} numberOfLines={3}>
                {permanentAddress || '—'}
              </Text>
            </View>
          </View>

          {/* ── CURRENT INFO – USER CAN EDIT ── */}
          <Text style={styles.sectionTitle}>Thông tin hiện tại</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Chỗ ở hiện tại *</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                errors.currentResidence && styles.inputError,
                sameAsPermanent && styles.inputDisabled,
              ]}
              value={currentResidence}
              onChangeText={(v) => {
                if (v.length <= 500) {
                  setCurrentResidence(v);
                  setSameAsPermanent(false);
                  validateField('currentResidence', v);
                }
              }}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh"
              placeholderTextColor={RHSColors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!sameAsPermanent}
            />
            <Text style={styles.charCount}>{currentResidence.length}/500</Text>
            {errors.currentResidence && (
              <Text style={styles.errorText}>{errors.currentResidence}</Text>
            )}

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setSameAsPermanent(!sameAsPermanent)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  sameAsPermanent && styles.checkboxActive,
                ]}
              >
                {sameAsPermanent && (
                  <Feather name="check" size={14} color="#fff" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                Chỗ ở hiện tại giống với Địa chỉ thường trú
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Nghề nghiệp</Text>
            <TextInput
              style={styles.input}
              value={occupation}
              onChangeText={setOccupation}
              placeholder="VD: Công nhân, nhân viên văn phòng..."
              placeholderTextColor={RHSColors.textMuted}
            />

            <Text style={styles.label}>Nơi làm việc</Text>
            <TextInput
              style={styles.input}
              value={workPlace}
              onChangeText={setWorkPlace}
              placeholder="Tên công ty, khu công nghiệp..."
              placeholderTextColor={RHSColors.textMuted}
            />
          </View>

          {/* Housing Status & Income */}
          <Text style={styles.sectionTitle}>Thực trạng nhà ở & Thu nhập</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Thực trạng nhà ở *</Text>
            {HOUSING_STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.radio,
                  housingStatus === opt.value && styles.radioActive,
                  errors.housingStatus && housingStatus !== opt.value && styles.radioError,
                ]}
                onPress={() => {
                  setHousingStatus(opt.value);
                  validateField('housingStatus', opt.value);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioDot,
                    housingStatus === opt.value && styles.radioDotActive,
                  ]}
                >
                  {housingStatus === opt.value && <View style={styles.radioDotFill} />}
                </View>
                <Text
                  style={[
                    styles.radioLabel,
                    housingStatus === opt.value && styles.radioLabelActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
            {errors.housingStatus && (
              <Text style={styles.errorText}>{errors.housingStatus}</Text>
            )}

            <Text style={[styles.label, { marginTop: 16 }]}>Thu nhập hàng tháng (VNĐ) *</Text>
            <View style={styles.incomeRow}>
              <Feather name="dollar-sign" size={18} color={RHSColors.blue700} />
              <TextInput
                style={[styles.input, { flex: 1 }, errors.income && styles.inputError]}
                value={incomeDisplay}
                onChangeText={(v) => {
                  const formatted = formatCurrency(v);
                  setIncomeDisplay(formatted);
                  validateField('income', formatted);
                }}
                placeholder="5,000,000"
                keyboardType="numeric"
                placeholderTextColor={RHSColors.textMuted}
              />
            </View>
            {errors.income && <Text style={styles.errorText}>{errors.income}</Text>}
            {incomeDisplay ? (
              <Text style={styles.incomeHint}>
                Thu nhập: {incomeDisplay} VNĐ/tháng
              </Text>
            ) : null}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSave}
            disabled={submitting}
            activeOpacity={0.9}
          >
            <View style={styles.submitGrad}>
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="save" size={18} color="#fff" />
                  <Text style={styles.submitText}>Lưu thay đổi</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: RHSColors.surface },

  whiteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
  },
  backBtn: { padding: 4, marginRight: 10 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: RHSColors.blue700 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 40 },

  sectionTitle: {
    ...typography.h3,
    color: RHSColors.text,
    marginBottom: 10,
    marginLeft: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },

  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.green50,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.xs,
    marginBottom: 12,
    gap: 8,
  },
  syncBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: RHSColors.green700,
    flex: 1,
    lineHeight: 16,
  },

  lockedInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.grey100,
    borderRadius: borderRadius.xs,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: RHSColors.grey200,
    marginBottom: 10,
  },
  lockedText: {
    fontSize: 14,
    fontWeight: '600',
    color: RHSColors.textSecondary,
    flex: 1,
  },

  label: { fontSize: 13, fontWeight: '600', color: RHSColors.textSecondary, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: RHSColors.grey50,
    borderRadius: borderRadius.xs,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: RHSColors.text,
    borderWidth: 1,
    borderColor: RHSColors.grey200,
  },
  inputError: { borderColor: RHSColors.red600, borderWidth: 1.5 },
  inputDisabled: { backgroundColor: RHSColors.grey100, color: RHSColors.textMuted },
  textArea: { minHeight: 72, paddingTop: 12 },
  charCount: { fontSize: 11, color: RHSColors.textMuted, textAlign: 'right', marginTop: 2 },
  errorText: { fontSize: 12, color: RHSColors.red600, marginTop: 4, fontWeight: '500' },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: RHSColors.grey300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: RHSColors.blue700,
    borderColor: RHSColors.blue700,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: RHSColors.text,
    flex: 1,
    lineHeight: 18,
  },

  radio: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: borderRadius.xs,
    borderWidth: 1.5,
    borderColor: RHSColors.grey200,
    marginBottom: 8,
    gap: 12,
  },
  radioActive: {
    borderColor: RHSColors.blue700,
    backgroundColor: RHSColors.blue50,
  },
  radioError: { borderColor: RHSColors.red600 },
  radioDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: RHSColors.grey300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDotActive: { borderColor: RHSColors.blue700 },
  radioDotFill: { width: 12, height: 12, borderRadius: 6, backgroundColor: RHSColors.blue700 },
  radioLabel: { fontSize: 15, fontWeight: '600', color: RHSColors.text, flex: 1 },
  radioLabelActive: { color: RHSColors.blue700 },

  incomeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  incomeHint: { fontSize: 12, color: RHSColors.blue700, marginTop: 4, fontWeight: '500' },

  submitBtn: { marginTop: 8, borderRadius: borderRadius.md, overflow: 'hidden' },
  submitGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
    backgroundColor: RHSColors.blue700,
  },
  submitText: { ...typography.button, color: '#fff' },
});