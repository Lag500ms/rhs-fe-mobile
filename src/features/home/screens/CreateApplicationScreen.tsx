import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RHSColors, borderRadius, shadows, typography } from '../../../lib/theme';
import { userApi } from '../../user/api/userApi';
import { housingApplicationApi, CreateApplicationRequest } from '../api/housingApplicationApi';
import { getToken } from '../../../lib/tokenStorage';

const HOUSING_STATUS_OPTIONS: { value: string; label: string; desc: string }[] = [
  { value: 'NO_HOUSE', label: 'Chưa có nhà ở', desc: 'Hiện tại chưa sở hữu nhà ở' },
  { value: 'SMALL_HOUSE', label: 'Nhà ở chật chội (dưới 15m²/người)', desc: 'Diện tích bình quân dưới 15m²/người' },
];

export const CreateApplicationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { projectId, projectName } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [occupation, setOccupation] = useState('');
  const [workPlace, setWorkPlace] = useState('');
  const [currentResidence, setCurrentResidence] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [housingStatus, setHousingStatus] = useState('');
  const [estimatedMonthlyIncome, setEstimatedMonthlyIncome] = useState('');

  // Load profile để điền sẵn họ tên + CCCD
  useEffect(() => {
    (async () => {
      try {
        const result = await userApi.getProfile();
        if (result.success && result.user) {
          setFullName(result.user.fullName || '');
          setCitizenId(result.user.citizenId || '');
          setCurrentResidence(result.user.address || '');
          setPermanentAddress(result.user.address || '');
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const validate = (): string | null => {
    if (!fullName.trim()) return 'Vui lòng nhập họ tên.';
    if (!citizenId.trim()) return 'Vui lòng nhập số CCCD.';
    if (!currentResidence.trim()) return 'Vui lòng nhập nơi ở hiện tại.';
    if (!permanentAddress.trim()) return 'Vui lòng nhập địa chỉ thường trú/tạm trú.';
    if (!housingStatus) return 'Vui lòng chọn thực trạng nhà ở.';
    const income = Number(estimatedMonthlyIncome);
    if (!estimatedMonthlyIncome.trim() || isNaN(income) || income <= 0) {
      return 'Vui lòng nhập mức thu nhập hàng tháng hợp lệ.';
    }
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) { Alert.alert('Thiếu thông tin', error); return; }

    const token = await getToken();
    if (!token) {
      Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để nộp hồ sơ.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateApplicationRequest = {
        projectId,
        fullName: fullName.trim(),
        citizenId: citizenId.trim(),
        occupation: occupation.trim() || undefined,
        workPlace: workPlace.trim() || undefined,
        currentResidence: currentResidence.trim(),
        permanentAddress: permanentAddress.trim(),
        housingStatus,
        estimatedMonthlyIncome: Number(estimatedMonthlyIncome),
      };

      const result = await housingApplicationApi.createApplication(payload);
      Alert.alert(
        'Hồ sơ đã tạo',
        'Tiếp theo, bạn cần upload 2 giấy tờ chứng minh để hoàn tất hồ sơ.',
        [
          { text: 'Để sau', style: 'cancel', onPress: () => navigation.goBack() },
          {
            text: 'Tiếp tục',
            onPress: () => {
              navigation.replace('UploadDocuments', {
                applicationId: result.applicationId,
              });
            },
          },
        ]
      );
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
        <View style={styles.headerGrad}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo hồ sơ</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.bar}>
        <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.red600 }]} />
        <View style={[styles.stripe, { flex: 0.4, backgroundColor: RHSColors.amber600 }]} />
        <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.blue700 }]} />
      </View>
      <LinearGradient colors={['#0A3A85', '#1565C0', '#1E88E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGrad}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo hồ sơ</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Project Name */}
        <View style={styles.projectCard}>
          <Feather name="home" size={18} color={RHSColors.blue700} />
          <Text style={styles.projectName} numberOfLines={2}>{projectName}</Text>
        </View>

        {/* Personal Info */}
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
        <View style={styles.card}>
          <Label>Họ và tên *</Label>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Nguyễn Văn A" placeholderTextColor={RHSColors.textMuted} />

          <Label>CCCD/CMND *</Label>
          <TextInput style={styles.input} value={citizenId} onChangeText={setCitizenId} placeholder="079123456789" keyboardType="numeric" maxLength={12} placeholderTextColor={RHSColors.textMuted} />

          <Label>Nghề nghiệp</Label>
          <TextInput style={styles.input} value={occupation} onChangeText={setOccupation} placeholder="Công nhân, nhân viên văn phòng..." placeholderTextColor={RHSColors.textMuted} />

          <Label>Nơi làm việc</Label>
          <TextInput style={styles.input} value={workPlace} onChangeText={setWorkPlace} placeholder="Công ty, khu công nghiệp..." placeholderTextColor={RHSColors.textMuted} />
        </View>

        {/* Address */}
        <Text style={styles.sectionTitle}>Địa chỉ</Text>
        <View style={styles.card}>
          <Label>Nơi ở hiện tại *</Label>
          <TextInput style={styles.input} value={currentResidence} onChangeText={setCurrentResidence} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh" placeholderTextColor={RHSColors.textMuted} />

          <Label>Địa chỉ thường trú / tạm trú *</Label>
          <TextInput style={styles.input} value={permanentAddress} onChangeText={setPermanentAddress} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh" placeholderTextColor={RHSColors.textMuted} />
        </View>

        {/* Housing Status + Income */}
        <Text style={styles.sectionTitle}>Thực trạng nhà ở & Thu nhập</Text>
        <View style={styles.card}>
          <Label>Thực trạng nhà ở *</Label>
          {HOUSING_STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.radio, housingStatus === opt.value && styles.radioActive]}
              onPress={() => setHousingStatus(opt.value)}
              activeOpacity={0.7}
            >
              <View style={[styles.radioDot, housingStatus === opt.value && styles.radioDotActive]}>
                {housingStatus === opt.value && <View style={styles.radioDotFill} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.radioLabel, housingStatus === opt.value && styles.radioLabelActive]}>{opt.label}</Text>
                <Text style={styles.radioDesc}>{opt.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <Label style={{ marginTop: 16 }}>Thu nhập hàng tháng (VNĐ) *</Label>
          <TextInput
            style={styles.input}
            value={estimatedMonthlyIncome}
            onChangeText={setEstimatedMonthlyIncome}
            placeholder="10.000.000"
            keyboardType="numeric"
            placeholderTextColor={RHSColors.textMuted}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting} activeOpacity={0.9}>
          <LinearGradient colors={[RHSColors.red600, '#B71C1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGrad}>
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="send" size={18} color="#fff" />
                <Text style={styles.submitText}>Nộp hồ sơ</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const Label = ({ children, style }: { children: string; style?: any }) => (
  <Text style={[styles.label, style]}>{children}</Text>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  bar: { flexDirection: 'row', height: 4 },
  stripe: { height: '100%' },
  headerGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  backBtn: { padding: 4, marginRight: 10 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: RHSColors.surface },

  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.blue50,
    padding: 14,
    borderRadius: borderRadius.lg,
    marginBottom: 20,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: RHSColors.blue700,
  },
  projectName: { flex: 1, fontSize: 15, fontWeight: '700', color: RHSColors.text, lineHeight: 22 },

  sectionTitle: { ...typography.h3, color: RHSColors.text, marginBottom: 10, marginLeft: 2 },

  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    padding: 16,
    marginBottom: 18,
    ...shadows.sm,
  },

  label: { fontSize: 13, fontWeight: '600', color: RHSColors.textSecondary, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: RHSColors.grey50,
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: RHSColors.text,
    borderWidth: 1,
    borderColor: RHSColors.grey200,
  },

  radio: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: RHSColors.grey200,
    marginBottom: 8,
    gap: 10,
  },
  radioActive: {
    borderColor: RHSColors.blue700,
    backgroundColor: RHSColors.blue50,
  },
  radioDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: RHSColors.grey300,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  radioDotActive: { borderColor: RHSColors.blue700 },
  radioDotFill: { width: 12, height: 12, borderRadius: 6, backgroundColor: RHSColors.blue700 },
  radioLabel: { fontSize: 14, fontWeight: '600', color: RHSColors.text },
  radioLabelActive: { color: RHSColors.blue700 },
  radioDesc: { fontSize: 12, color: RHSColors.textMuted, marginTop: 2 },

  submitBtn: { marginTop: 8, borderRadius: borderRadius.lg, overflow: 'hidden', ...shadows.floating },
  submitGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 8 },
  submitText: { ...typography.button, color: '#fff' },
});