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
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { BrandBar } from '../../../components/BrandBar';
import { RHSColors, borderRadius, typography, spacing } from '../../../lib/theme';
import { userApi } from '../../user/api/userApi';
import { housingApplicationApi } from '../api/housingApplicationApi';
import { ApplicationStepper } from '../components/ApplicationStepper';
import { isReadyForApplicationForm } from '../../user/utils/ekycGate';
import type { ApplicationDraftPersonal } from '../types/applicationDraft';

const HOUSING_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'NO_HOUSE', label: 'Chưa có nhà ở thuộc sở hữu của mình' },
  { value: 'SMALL_HOUSE', label: 'Có nhà ở nhưng diện tích bình quân < 15 m²/người' },
];

const MARITAL_STATUS_OPTIONS = [
  { value: 'SINGLE', label: 'Độc thân' },
  { value: 'MARRIED', label: 'Đã kết hôn' },
  { value: 'DIVORCED', label: 'Ly hôn' },
  { value: 'WIDOWED', label: 'Góa' },
];

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
  const [activeBlock, setActiveBlock] = useState<string | null>(null);

  // ── Locked fields from eKYC ──
  const [fullName, setFullName] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [ekycReady, setEkycReady] = useState(false);

  // ── User-entered fields (Mẫu số 01) ──
  const [currentResidence, setCurrentResidence] = useState('');
  const [sameAsPermanent, setSameAsPermanent] = useState(false);
  const [occupation, setOccupation] = useState('');
  const [workPlace, setWorkPlace] = useState('');
  const [housingStatus, setHousingStatus] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [spouseMonthlyIncome, setSpouseMonthlyIncome] = useState('');
  const [averageHousingAreaPerPerson, setAverageHousingAreaPerPerson] = useState('');

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

  // Load profile + active-check
  useEffect(() => {
    (async () => {
      try {
        const [profileResult, active] = await Promise.all([
          userApi.getProfile(),
          housingApplicationApi.activeCheck().catch(() => null),
        ]);

        if (active?.hasActiveApplication) {
          setActiveBlock(
            active.message ||
              'Bạn đang có hồ sơ khác đang hoạt động. Không thể tạo hồ sơ mới.',
          );
        }

        if (profileResult.success && profileResult.user) {
          const name = (profileResult.user.fullName || '').trim();
          const cid = (profileResult.user.citizenId || '').trim();
          const addr = (profileResult.user.address || '').trim();
          const dob = profileResult.user.dateOfBirth
            ? String(profileResult.user.dateOfBirth).slice(0, 10)
            : '';

          setFullName(name);
          setCitizenId(cid);
          setPermanentAddress(addr);
          setDateOfBirth(dob);
          setEkycReady(isReadyForApplicationForm(profileResult.user));
        } else {
          setEkycReady(false);
        }
      } catch {
        setEkycReady(false);
        Alert.alert('Lỗi', 'Không thể tải thông tin hồ sơ. Kiểm tra kết nối và thử lại.');
      } finally {
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
      case 'monthlyIncome': {
        if (value.trim() === '') newErrors.monthlyIncome = 'Vui lòng nhập thu nhập hàng tháng';
        else if (isNaN(Number(value)) || Number(value) < 0) newErrors.monthlyIncome = 'Thu nhập không hợp lệ';
        else delete newErrors.monthlyIncome;
        break;
      }
      case 'spouseMonthlyIncome': {
        if (maritalStatus === 'MARRIED') {
          if (value.trim() === '') newErrors.spouseMonthlyIncome = 'Bắt buộc khi đã kết hôn (có thể là 0)';
          else if (isNaN(Number(value)) || Number(value) < 0) newErrors.spouseMonthlyIncome = 'Thu nhập không hợp lệ';
          else delete newErrors.spouseMonthlyIncome;
        } else {
          delete newErrors.spouseMonthlyIncome;
        }
        break;
      }
      case 'averageHousingAreaPerPerson': {
        const areaNum = parseFloat(value.replace(/,/g, ''));
        if (!value.trim()) newErrors.averageHousingAreaPerPerson = 'Vui lòng nhập diện tích bình quân đầu người';
        else if (isNaN(areaNum) || areaNum < 0) newErrors.averageHousingAreaPerPerson = 'Diện tích không hợp lệ';
        else if (areaNum >= 15) newErrors.averageHousingAreaPerPerson = 'Diện tích phải dưới 15 m²/người';
        else delete newErrors.averageHousingAreaPerPerson;
        break;
      }
    }
    setErrors(newErrors);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!ekycReady) {
      newErrors.ekyc = 'Chưa đủ thông tin định danh eKYC (họ tên, CCCD, địa chỉ thường trú). Vui lòng xác minh danh tính trước.';
    }
    if (!currentResidence.trim()) newErrors.currentResidence = 'Vui lòng nhập nơi ở hiện tại';
    if (!housingStatus) newErrors.housingStatus = 'Vui lòng chọn thực trạng nhà ở';
    if (!maritalStatus) newErrors.maritalStatus = 'Vui lòng chọn tình trạng hôn nhân';
    if (monthlyIncome.trim() === '' || isNaN(Number(monthlyIncome)) || Number(monthlyIncome) < 0) {
      newErrors.monthlyIncome = 'Vui lòng nhập thu nhập hàng tháng hợp lệ';
    }
    if (maritalStatus === 'MARRIED') {
      if (
        spouseMonthlyIncome.trim() === '' ||
        isNaN(Number(spouseMonthlyIncome)) ||
        Number(spouseMonthlyIncome) < 0
      ) {
        newErrors.spouseMonthlyIncome = 'Khi đã kết hôn: bắt buộc khai thu nhập vợ/chồng (có thể là 0)';
      }
    }

    if (housingStatus === 'SMALL_HOUSE') {
      const areaNum = parseFloat(averageHousingAreaPerPerson.replace(/,/g, ''));
      if (!averageHousingAreaPerPerson.trim()) {
        newErrors.averageHousingAreaPerPerson = 'Vui lòng nhập diện tích bình quân đầu người';
      } else if (isNaN(areaNum) || areaNum < 0) {
        newErrors.averageHousingAreaPerPerson = 'Diện tích không hợp lệ';
      } else if (areaNum >= 15) {
        newErrors.averageHousingAreaPerPerson = 'Diện tích phải dưới 15 m²/người';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAndContinue = () => {
    if (activeBlock) {
      Alert.alert('Không thể tạo hồ sơ', activeBlock);
      return;
    }
    if (!validate()) return;

    const draftPersonal: ApplicationDraftPersonal = {
      projectId,
      projectName,
      fullName: fullName.trim(),
      citizenId: citizenId.replace(/\s/g, ''),
      permanentAddress: permanentAddress.trim(),
      currentResidence: currentResidence.trim(),
      occupation: occupation.trim() || undefined,
      workPlace: workPlace.trim() || undefined,
      housingStatus,
      maritalStatus,
      monthlyIncome: Number(monthlyIncome),
      spouseMonthlyIncome:
        maritalStatus === 'MARRIED' ? Number(spouseMonthlyIncome) : undefined,
      averageHousingAreaPerPerson:
        housingStatus === 'SMALL_HOUSE' && averageHousingAreaPerPerson.trim()
          ? parseFloat(averageHousingAreaPerPerson.replace(/,/g, ''))
          : undefined,
    };

    navigation.navigate('HouseholdMembers', {
      draftPersonal,
      projectName,
      next: 'PriorityGroup',
    });
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
        <Text style={styles.headerTitle}>Bước 1/5 — Cá nhân</Text>
        <View style={{ width: 36 }} />
      </View>

      <ApplicationStepper current={1} />

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

          {!!activeBlock && (
            <View style={styles.activeBlockCard}>
              <Feather name="alert-circle" size={18} color={RHSColors.red600} />
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={styles.activeBlockText}>{activeBlock}</Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.dispatch(
                      CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'MyApplications' }],
                      }),
                    )
                  }
                >
                  <Text style={styles.activeBlockLink}>Xem hồ sơ của tôi →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── IDENTITY INFO – LOCKED FROM eKYC (Mẫu 01 mục 2, 3, 7) ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Thông tin định danh (eKYC)</Text>
            <View style={styles.card}>
            <View style={[styles.syncBadge, !ekycReady && { backgroundColor: '#FEF3C7' }]}>
              <Feather
                name={ekycReady ? 'check-circle' : 'alert-triangle'}
                size={14}
                color={ekycReady ? RHSColors.green600 : '#D97706'}
              />
              <Text style={[styles.syncBadgeText, !ekycReady && { color: '#92400E' }]}>
                {ekycReady
                  ? 'Đã dán sẵn từ dữ liệu eKYC: họ tên, CCCD, địa chỉ thường trú'
                  : 'Thiếu dữ liệu eKYC — cần xác minh danh tính trước khi đăng ký'}
              </Text>
            </View>
            {errors.ekyc && <Text style={styles.errorText}>{errors.ekyc}</Text>}

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

            {!!dateOfBirth && (
              <>
                <Text style={styles.label}>Ngày sinh</Text>
                <View style={styles.lockedInput}>
                  <Feather name="calendar" size={16} color={RHSColors.textMuted} />
                  <Text style={styles.lockedText}>{dateOfBirth}</Text>
                </View>
              </>
            )}

            <Text style={styles.label}>Đăng ký thường trú / tạm trú *</Text>
            <View style={styles.lockedInput}>
              <Feather name="bookmark" size={16} color={RHSColors.textMuted} />
              <Text style={styles.lockedText} numberOfLines={3}>
                {permanentAddress || '—'}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: RHSColors.textMuted, marginTop: 6 }}>
              Ngày cấp / nơi cấp CCCD chưa lưu trên hồ sơ eKYC hiện tại — bổ sung khi nộp giấy tờ.
            </Text>
          </View>
          </View>

          {/* ── CURRENT INFO – USER ENTERS ── */}
          <View style={styles.sectionCard}>
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
          </View>

          {/* ── HỘ GIA ĐÌNH ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Thông tin hộ gia đình</Text>
            <View style={styles.card}>
            <Text style={styles.label}>Tình trạng hôn nhân *</Text>
            {MARITAL_STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.radio,
                  maritalStatus === opt.value && styles.radioActive,
                  errors.maritalStatus && maritalStatus !== opt.value && styles.radioError,
                ]}
                onPress={() => {
                  setMaritalStatus(opt.value);
                  setErrors(prev => { const e = { ...prev }; delete e.maritalStatus; return e; });
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioDot,
                    maritalStatus === opt.value && styles.radioDotActive,
                  ]}
                >
                  {maritalStatus === opt.value && <View style={styles.radioDotFill} />}
                </View>
                <Text
                  style={[
                    styles.radioLabel,
                    maritalStatus === opt.value && styles.radioLabelActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
            {errors.maritalStatus && (
              <Text style={styles.errorText}>{errors.maritalStatus}</Text>
            )}

            <Text style={[styles.helperText, { marginTop: 12 }]}>
              Số thành viên hộ = 1 (bạn) + thành viên thêm ở bước tiếp theo. Độc thân có thể bỏ trống bước đó.
            </Text>

            <Text style={[styles.label, { marginTop: 16 }]}>Thu nhập hàng tháng (VNĐ) *</Text>
            <TextInput
              style={[styles.input, errors.monthlyIncome && styles.inputError]}
              value={monthlyIncome}
              onChangeText={(v) => {
                setMonthlyIncome(v.replace(/[^\d.]/g, ''));
                validateField('monthlyIncome', v.replace(/[^\d.]/g, ''));
              }}
              placeholder="Ví dụ: 12000000"
              keyboardType="numeric"
              placeholderTextColor={RHSColors.textMuted}
            />
            {errors.monthlyIncome && <Text style={styles.errorText}>{errors.monthlyIncome}</Text>}

            {maritalStatus === 'MARRIED' && (
              <>
                <Text style={[styles.label, { marginTop: 12 }]}>Thu nhập vợ/chồng (VNĐ) *</Text>
                <TextInput
                  style={[styles.input, errors.spouseMonthlyIncome && styles.inputError]}
                  value={spouseMonthlyIncome}
                  onChangeText={(v) => {
                    setSpouseMonthlyIncome(v.replace(/[^\d.]/g, ''));
                    validateField('spouseMonthlyIncome', v.replace(/[^\d.]/g, ''));
                  }}
                  placeholder="Có thể nhập 0"
                  keyboardType="numeric"
                  placeholderTextColor={RHSColors.textMuted}
                />
                {errors.spouseMonthlyIncome && (
                  <Text style={styles.errorText}>{errors.spouseMonthlyIncome}</Text>
                )}
              </>
            )}
          </View>
          </View>

          {/* Housing Status */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Thực trạng nhà ở</Text>
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

            {housingStatus === 'SMALL_HOUSE' && (
              <>
                <Text style={[styles.label, { marginTop: 16 }]}>
                  Diện tích bình quân đầu người (m²) *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.averageHousingAreaPerPerson && styles.inputError,
                  ]}
                  value={averageHousingAreaPerPerson}
                  onChangeText={(v) => {
                    if (/^[\d.,]*$/.test(v)) {
                      setAverageHousingAreaPerPerson(v);
                      validateField('averageHousingAreaPerPerson', v);
                    }
                  }}
                  placeholder="VD: 12.5 (phải dưới 15)"
                  keyboardType="decimal-pad"
                  placeholderTextColor={RHSColors.textMuted}
                />
                <Text style={styles.helperText}>Theo Đ29: diện tích bình quân phải dưới 15 m²/người.</Text>
                {errors.averageHousingAreaPerPerson && (
                  <Text style={styles.errorText}>{errors.averageHousingAreaPerPerson}</Text>
                )}
              </>
            )}
          </View>
          </View>

          {/* Submit Button - BLUE */}
          <TouchableOpacity
            style={[styles.submitBtn, !!activeBlock && { opacity: 0.5 }]}
            onPress={handleSaveAndContinue}
            disabled={!!activeBlock}
            activeOpacity={0.9}
          >
            <View style={styles.submitGrad}>
              <Feather name="arrow-right" size={18} color="#fff" />
              <Text style={styles.submitText}>Tiếp tục hộ gia đình</Text>
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
  activeBlockCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: borderRadius.md,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  activeBlockText: { fontSize: 13, color: '#C62828', fontWeight: '600', lineHeight: 18 },
  activeBlockLink: { fontSize: 13, color: RHSColors.blue700, fontWeight: '700' },

  // Sections
  sectionCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: RHSColors.text,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: RHSColors.border,
    shadowColor: RHSColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
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
  helperText: { fontSize: 12, color: RHSColors.textMuted, marginTop: 6, lineHeight: 18 },

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
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: RHSColors.grey200,
    marginBottom: spacing.sm,
    gap: spacing.md,
    minHeight: 56,
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
  radioLabel: { fontSize: 13, fontWeight: '600', color: RHSColors.text, flex: 1, lineHeight: 18 },
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