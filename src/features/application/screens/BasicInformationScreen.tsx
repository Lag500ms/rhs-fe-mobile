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
import { userApi } from '../../user/api/userApi';
import { housingApplicationApi, CreateApplicationRequest } from '../api/housingApplicationApi';

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

export const BasicInformationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { projectId, projectName } = route.params;

  // Hide bottom tab bar when entering creation flow
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

  // ── Locked fields from eKYC ──
  const [fullName, setFullName] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');

  // ── User-entered fields ──
  const [currentResidence, setCurrentResidence] = useState('');
  const [sameAsPermanent, setSameAsPermanent] = useState(false);
  const [occupation, setOccupation] = useState('');
  const [workPlace, setWorkPlace] = useState('');
  const [housingStatus, setHousingStatus] = useState('');
  const [incomeDisplay, setIncomeDisplay] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync currentResidence when checkbox is toggled
  useEffect(() => {
    if (sameAsPermanent && permanentAddress) {
      setCurrentResidence(permanentAddress);
      setErrors(prev => { const e = { ...prev }; delete e.currentResidence; return e; });
    } else if (!sameAsPermanent) {
      setCurrentResidence('');
    }
  }, [sameAsPermanent, permanentAddress]);

  // Load profile from eKYC
  useEffect(() => {
    (async () => {
      try {
        const result = await userApi.getProfile();
        if (result.success && result.user) {
          setFullName(result.user.fullName || '');
          setCitizenId(result.user.citizenId || '');
          setPermanentAddress(result.user.address || '');
        }
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const handleSaveAndContinue = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload: CreateApplicationRequest = {
        projectId,
        fullName: fullName.trim(),
        citizenId: citizenId.replace(/\s/g, ''),
        permanentAddress: permanentAddress.trim(),
        currentResidence: currentResidence.trim(),
        occupation: occupation.trim() || undefined,
        workPlace: workPlace.trim() || undefined,
        housingStatus,
        estimatedMonthlyIncome: parseCurrency(incomeDisplay),
      };

      const result = await housingApplicationApi.createApplication(payload);
      navigation.replace('UploadDocuments', {
        applicationId: result.applicationId,
        projectName,
      });
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
      {/* Thin brand bar at top */}
      <BrandBar />

      {/* White header */}
      <View style={styles.whiteHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={RHSColors.blue700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin đăng ký</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Stepper - refined */}
      <View style={styles.stepper}>
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, styles.stepCircleActive]}>
            <Text style={styles.stepCircleText}>1</Text>
          </View>
          <Text style={[styles.stepLabel, styles.stepLabelActive]}>Thông tin</Text>
        </View>
        <View style={[styles.stepLine, styles.stepLineActive]} />
        <View style={styles.stepItem}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepCircleTextInactive}>2</Text>
          </View>
          <Text style={styles.stepLabel}>Giấy tờ</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepItem}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepCircleTextInactive}>3</Text>
          </View>
          <Text style={styles.stepLabel}>Nộp hồ sơ</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -100}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Project Card */}
          <View style={styles.projectCard}>
            <Feather name="home" size={18} color={RHSColors.blue700} />
            <Text style={styles.projectName} numberOfLines={2}>
              {projectName}
            </Text>
          </View>

          {/* ── IDENTITY INFO – LOCKED FROM eKYC ── */}
          <Text style={styles.sectionTitle}>Thông tin định danh</Text>
          <View style={styles.card}>
            {/* Sync badge */}
            <View style={styles.syncBadge}>
              <Feather name="check-circle" size={14} color={RHSColors.green600} />
              <Text style={styles.syncBadgeText}>
                Thông tin được đồng bộ từ Dữ liệu định danh eKYC
              </Text>
            </View>

            <Text style={styles.label}>Họ và tên *</Text>
            <View style={styles.lockedInput}>
              <Feather name="user" size={16} color={RHSColors.textMuted} />
              <Text style={styles.lockedText}>{fullName || '—'}</Text>
            </View>

            <Text style={styles.label}>Số CCCD *</Text>
            <View style={styles.lockedInput}>
              <Feather name="credit-card" size={16} color={RHSColors.textMuted} />
              <Text style={styles.lockedText}>{citizenId || '—'}</Text>
            </View>

            <Text style={styles.label}>Địa chỉ thường trú *</Text>
            <View style={styles.lockedInput}>
              <Feather name="bookmark" size={16} color={RHSColors.textMuted} />
              <Text style={styles.lockedText} numberOfLines={3}>
                {permanentAddress || '—'}
              </Text>
            </View>
          </View>

          {/* ── CURRENT INFO – USER ENTERS ── */}
          <Text style={styles.sectionTitle}>Thông tin hiện tại</Text>
          <View style={styles.card}>
            {/* Current Residence */}
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

            {/* Same as permanent address checkbox */}
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

            {/* Occupation */}
            <Text style={styles.label}>Nghề nghiệp</Text>
            <TextInput
              style={styles.input}
              value={occupation}
              onChangeText={setOccupation}
              placeholder="VD: Công nhân, nhân viên văn phòng..."
              placeholderTextColor={RHSColors.textMuted}
            />

            {/* Workplace */}
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
              <Feather name="trending-up" size={18} color={RHSColors.blue700} />
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

          {/* Submit Button - BLUE */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSaveAndContinue}
            disabled={submitting}
            activeOpacity={0.9}
          >
            <View style={styles.submitGrad}>
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="save" size={18} color="#fff" />
                  <Text style={styles.submitText}>Lưu & Tiếp tục</Text>
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

  // White header
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

  // Stepper - refined
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.grey200,
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: RHSColors.grey300,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: { backgroundColor: RHSColors.blue700, borderColor: RHSColors.blue700 },
  stepCircleText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  stepCircleTextInactive: { fontSize: 13, fontWeight: '700', color: RHSColors.grey500 },
  stepLabel: { fontSize: 11, fontWeight: '500', color: RHSColors.grey500 },
  stepLabelActive: { color: RHSColors.blue700, fontWeight: '700' },
  stepLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: RHSColors.grey300,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  stepLineActive: { backgroundColor: RHSColors.blue700 },

  // Header
  headerGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 40 },

  // Project Card
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.blue50,
    padding: 14,
    borderRadius: borderRadius.md,
    marginBottom: 20,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: RHSColors.blue700,
  },
  projectName: { flex: 1, fontSize: 15, fontWeight: '700', color: RHSColors.text, lineHeight: 22 },

  // Sections
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

  // ── eKYC Sync Badge ──
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

  // ── Locked Input (read-only) ──
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

  // ── Inputs ──
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

  // ── Checkbox ──
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

  // ── Radio ──
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

  // Income
  incomeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  incomeHint: { fontSize: 12, color: RHSColors.blue700, marginTop: 4, fontWeight: '500' },

  // Submit - BLUE
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