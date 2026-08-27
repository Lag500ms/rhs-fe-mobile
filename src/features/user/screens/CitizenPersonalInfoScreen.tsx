import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { BrandBar } from '../../../components/BrandBar';
import { RHSColors, borderRadius, spacing, typography, shadows } from '../../../lib/theme';
import { appAlert } from '../../../lib/appDialog';
import { citizenProfileApi } from '../api/citizenProfileApi';
import {
  HOUSING_OPTIONS,
  MARITAL_OPTIONS,
  type CitizenFullProfileDto,
  type HousingStatus,
  type MaritalStatus,
  type UpdateCitizenProfileDto,
} from '../types/citizenProfile';
import {
  MAX_COUPLE_INCOME,
  MAX_SINGLE_INCOME,
  MAX_SMALL_HOUSE_AREA,
  isFutureDateOnly,
  isValidCitizenId,
  normalizeCitizenId,
  parseDateOnly,
} from '../../../lib/fieldRules';

export const CitizenPersonalInfoScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CitizenFullProfileDto | null>(null);

  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus | ''>('');
  const [spouseFullName, setSpouseFullName] = useState('');
  const [spouseCitizenId, setSpouseCitizenId] = useState('');
  const [spouseDateOfBirth, setSpouseDateOfBirth] = useState('');
  const [spouseMonthlyIncome, setSpouseMonthlyIncome] = useState('');
  const [occupation, setOccupation] = useState('');
  const [workPlace, setWorkPlace] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [currentResidence, setCurrentResidence] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [housingStatus, setHousingStatus] = useState<HousingStatus | ''>('');
  const [avgArea, setAvgArea] = useState('');

  const hydrate = (p: CitizenFullProfileDto) => {
    setProfile(p);
    setMaritalStatus((p.maritalStatus as MaritalStatus) || '');
    setSpouseFullName(p.spouseFullName || '');
    setSpouseCitizenId(p.spouseCitizenId || '');
    setSpouseDateOfBirth(p.spouseDateOfBirth ? p.spouseDateOfBirth.split('T')[0] : '');
    setSpouseMonthlyIncome(
      p.spouseMonthlyIncome != null ? String(p.spouseMonthlyIncome) : '',
    );
    setOccupation(p.occupation || '');
    setWorkPlace(p.workPlace || '');
    setMonthlyIncome(p.monthlyIncome != null ? String(p.monthlyIncome) : '');
    setCurrentResidence(p.currentResidence || '');
    setPermanentAddress(p.permanentAddress || '');
    setHousingStatus((p.housingStatus as HousingStatus) || '');
    setAvgArea(
      p.averageHousingAreaPerPerson != null ? String(p.averageHousingAreaPerPerson) : '',
    );
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await citizenProfileApi.getFullProfile();
      hydrate(p);
    } catch (e: any) {
      appAlert('Lỗi', e?.response?.data?.message || 'Không tải được hồ sơ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const parseNumber = (v: string): number | null => {
    const n = Number(v.replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : null;
  };

  const handleSave = async () => {
    if (!maritalStatus) {
      appAlert('Thiếu thông tin', 'Vui lòng chọn tình trạng hôn nhân.');
      return;
    }
    if (!housingStatus) {
      appAlert('Thiếu thông tin', 'Vui lòng chọn thực trạng nhà ở.');
      return;
    }
    if (maritalStatus === 'MARRIED' && !spouseFullName.trim()) {
      appAlert('Thiếu thông tin', 'Khi đã kết hôn bắt buộc khai họ tên vợ/chồng.');
      return;
    }
    if (spouseFullName.trim().length > 100) {
      appAlert('Không hợp lệ', 'Họ tên vợ/chồng không được quá 100 ký tự.');
      return;
    }
    const spouseCid = normalizeCitizenId(spouseCitizenId);
    if (spouseCid) {
      if (!isValidCitizenId(spouseCid)) {
        appAlert('Không hợp lệ', 'CCCD vợ/chồng phải gồm 9 hoặc 12 chữ số.');
        return;
      }
      if (profile?.citizenId && spouseCid === normalizeCitizenId(profile.citizenId)) {
        appAlert('Không hợp lệ', 'CCCD vợ/chồng không được trùng với CCCD của bạn.');
        return;
      }
    }
    if (spouseDateOfBirth.trim()) {
      if (!parseDateOnly(spouseDateOfBirth)) {
        appAlert('Không hợp lệ', 'Ngày sinh vợ/chồng phải theo định dạng năm-tháng-ngày, ví dụ 1990-01-15.');
        return;
      }
      if (isFutureDateOnly(spouseDateOfBirth)) {
        appAlert('Không hợp lệ', 'Ngày sinh vợ/chồng không được ở tương lai.');
        return;
      }
    }
    if (occupation.trim().length > 200) {
      appAlert('Không hợp lệ', 'Nghề nghiệp không được quá 200 ký tự.');
      return;
    }
    if (workPlace.trim().length > 500) {
      appAlert('Không hợp lệ', 'Nơi làm việc không được quá 500 ký tự.');
      return;
    }
    if (currentResidence.trim().length > 500 || permanentAddress.trim().length > 500) {
      appAlert('Không hợp lệ', 'Địa chỉ không được quá 500 ký tự.');
      return;
    }
    if (housingStatus === 'SMALL_HOUSE') {
      if (!avgArea.trim()) {
        appAlert('Thiếu thông tin', 'Nhà chật hẹp cần nhập diện tích bình quân (m²/người).');
        return;
      }
      const area = parseNumber(avgArea);
      if (area == null || area <= 0) {
        appAlert('Không hợp lệ', 'Diện tích bình quân phải lớn hơn 0.');
        return;
      }
      if (area >= MAX_SMALL_HOUSE_AREA) {
        appAlert(
          'Không hợp lệ',
          `Diện tích bình quân phải dưới ${MAX_SMALL_HOUSE_AREA} m²/người.`,
        );
        return;
      }
    }

    const ownIncome = monthlyIncome ? parseNumber(monthlyIncome) : null;
    const spouseInc = spouseMonthlyIncome ? parseNumber(spouseMonthlyIncome) : null;
    if (ownIncome != null && ownIncome < 0) {
      appAlert('Không hợp lệ', 'Thu nhập không được âm.');
      return;
    }
    if (spouseInc != null && spouseInc < 0) {
      appAlert('Không hợp lệ', 'Thu nhập vợ/chồng không được âm.');
      return;
    }

    const dto: UpdateCitizenProfileDto = {
      maritalStatus,
      housingStatus,
      occupation: occupation.trim() || null,
      workPlace: workPlace.trim() || null,
      currentResidence: currentResidence.trim() || null,
      permanentAddress: permanentAddress.trim() || null,
      monthlyIncome: monthlyIncome ? parseNumber(monthlyIncome) : null,
      averageHousingAreaPerPerson:
        housingStatus === 'SMALL_HOUSE' && avgArea ? parseNumber(avgArea) : null,
    };

    if (maritalStatus === 'MARRIED') {
      dto.spouseFullName = spouseFullName.trim();
      dto.spouseCitizenId = spouseCid || null;
      dto.spouseDateOfBirth = spouseDateOfBirth
        ? new Date(spouseDateOfBirth).toISOString()
        : null;
      dto.spouseMonthlyIncome = spouseMonthlyIncome
        ? parseNumber(spouseMonthlyIncome)
        : null;
    } else {
      dto.spouseFullName = null;
      dto.spouseCitizenId = null;
      dto.spouseDateOfBirth = null;
      dto.spouseMonthlyIncome = null;
    }

    setSaving(true);
    try {
      const updated = await citizenProfileApi.updateCitizenProfile(dto);
      hydrate(updated);
      appAlert('Thành công', 'Đã lưu thông tin nhân thân.', [
        { text: 'Đồng ý', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      appAlert('Lỗi', e?.response?.data?.message || 'Không lưu được hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandBar />
        <ScreenHeader title="Thông tin nhân thân" isWhite />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <ScreenHeader title="Thông tin nhân thân" isWhite />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Section title="Định danh (chỉ đọc)">
            <ReadonlyRow label="Họ tên" value={profile?.fullName} />
            <ReadonlyRow label="CCCD" value={profile?.citizenId} />
            <ReadonlyRow
              label="Ngày sinh"
              value={
                profile?.dateOfBirth
                  ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN')
                  : undefined
              }
            />
          </Section>

          <Section title="Tình trạng hôn nhân">
            <ChipGroup
              options={MARITAL_OPTIONS}
              value={maritalStatus}
              onChange={(v) => setMaritalStatus(v as MaritalStatus)}
            />
            {maritalStatus === 'MARRIED' && (
              <View style={styles.spouseBlock}>
                <Field label="Họ tên vợ/chồng *" value={spouseFullName} onChange={setSpouseFullName} maxLength={100} />
                <Field
                  label="CCCD vợ/chồng"
                  value={spouseCitizenId}
                  onChange={(v) => setSpouseCitizenId(v.replace(/[^\d]/g, ''))}
                  keyboardType="number-pad"
                  maxLength={12}
                />
                <Field
                  label="Ngày sinh vợ/chồng (năm-tháng-ngày)"
                  value={spouseDateOfBirth}
                  onChange={setSpouseDateOfBirth}
                  placeholder="1990-01-15"
                />
                <Field
                  label="Thu nhập vợ/chồng (VNĐ/tháng)"
                  value={spouseMonthlyIncome}
                  onChange={setSpouseMonthlyIncome}
                  keyboardType="numeric"
                />
              </View>
            )}
            {maritalStatus === 'SINGLE' && (
              <Hint text="Cần giấy xác nhận tình trạng độc thân trong Kho giấy tờ." />
            )}
            {maritalStatus === 'DIVORCED' && (
              <Hint text="Cần quyết định / bản án ly hôn trong Kho giấy tờ." />
            )}
            {maritalStatus === 'MARRIED' && (
              <Hint text="Vợ/chồng sẽ được đồng bộ vào hộ gia đình với quan hệ vợ/chồng." />
            )}
          </Section>

          <Section title="Thu nhập & việc làm">
            <Field label="Nghề nghiệp" value={occupation} onChange={setOccupation} maxLength={200} />
            <Field label="Nơi làm việc" value={workPlace} onChange={setWorkPlace} maxLength={500} />
            <Field
              label="Thu nhập tháng của bạn (VNĐ)"
              value={monthlyIncome}
              onChange={setMonthlyIncome}
              keyboardType="numeric"
            />
            <Hint text="Đính kèm xác nhận thu nhập, bảng lương hoặc sao kê trong Kho giấy tờ." />
            {maritalStatus === 'SINGLE' && (parseNumber(monthlyIncome) || 0) > MAX_SINGLE_INCOME ? (
              <Hint
                text={`Độc thân: thu nhập tháng không được vượt ${MAX_SINGLE_INCOME.toLocaleString('vi-VN')} đ khi nộp hồ sơ.`}
              />
            ) : null}
            {maritalStatus === 'MARRIED' &&
            (parseNumber(monthlyIncome) || 0) + (parseNumber(spouseMonthlyIncome) || 0) >
              MAX_COUPLE_INCOME ? (
              <Hint
                text={`Đã kết hôn: tổng thu nhập vợ chồng không được vượt ${MAX_COUPLE_INCOME.toLocaleString('vi-VN')} đ khi nộp hồ sơ.`}
              />
            ) : null}
          </Section>

          <Section title="Nơi ở & điều kiện nhà">
            <Field
              label="Nơi ở hiện tại"
              value={currentResidence}
              onChange={setCurrentResidence}
              multiline
              maxLength={500}
            />
            <Field
              label="Địa chỉ thường trú"
              value={permanentAddress}
              onChange={setPermanentAddress}
              multiline
              maxLength={500}
            />
            <ChipGroup
              options={HOUSING_OPTIONS}
              value={housingStatus}
              onChange={(v) => setHousingStatus(v as HousingStatus)}
            />
            {housingStatus === 'SMALL_HOUSE' && (
              <Field
                label="Diện tích bình quân (m²/người) — phải dưới 10 *"
                value={avgArea}
                onChange={setAvgArea}
                keyboardType="decimal-pad"
              />
            )}
            <Hint text="Bắt buộc giấy xác nhận điều kiện nhà ở trong Kho giấy tờ." />
          </Section>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Lưu thông tin</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const ReadonlyRow = ({ label, value }: { label: string; value?: string | null }) => (
  <View style={styles.readonly}>
    <Text style={styles.readonlyLabel}>{label}</Text>
    <Text style={styles.readonlyValue}>{value || '—'}</Text>
  </View>
);

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  multiline,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  maxLength?: number;
}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && { minHeight: 72, textAlignVertical: 'top' }]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder || label}
      placeholderTextColor={RHSColors.grey400}
      keyboardType={keyboardType}
      multiline={multiline}
      maxLength={maxLength}
    />
  </View>
);

const ChipGroup = ({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <View style={styles.chips}>
    {options.map((o) => {
      const active = value === o.value;
      return (
        <TouchableOpacity
          key={o.value}
          style={[styles.chip, active && styles.chipActive]}
          onPress={() => onChange(o.value)}
        >
          <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const Hint = ({ text }: { text: string }) => <Text style={styles.hint}>{text}</Text>;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, paddingBottom: 48 },
  section: {
    backgroundColor: RHSColors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: { ...typography.h3, color: RHSColors.text, marginBottom: spacing.md },
  readonly: { marginBottom: spacing.sm },
  readonlyLabel: { fontSize: 12, color: RHSColors.textMuted },
  readonlyValue: { fontSize: 15, fontWeight: '600', color: RHSColors.text, marginTop: 2 },
  field: { marginBottom: spacing.md },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: RHSColors.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: RHSColors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: RHSColors.text,
    backgroundColor: RHSColors.grey50,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
    backgroundColor: RHSColors.grey50,
  },
  chipActive: { backgroundColor: RHSColors.blue50, borderColor: RHSColors.blue700 },
  chipText: { fontSize: 13, color: RHSColors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: RHSColors.blue700 },
  spouseBlock: { marginTop: spacing.sm },
  hint: { fontSize: 12, color: RHSColors.textMuted, lineHeight: 18, marginTop: 4 },
  saveBtn: {
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
