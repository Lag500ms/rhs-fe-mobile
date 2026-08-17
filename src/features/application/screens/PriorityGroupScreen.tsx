import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BrandBar } from '../../../components/BrandBar';
import { RHSColors, borderRadius, spacing, typography } from '../../../lib/theme';
import { housingApplicationApi } from '../api/housingApplicationApi';
import { householdMemberApi } from '../api/householdMemberApi';
import { lookupApi } from '../api/lookupApi';
import { CreateApplicationRequest, PriorityGroupItem } from '../types/application';
import { ApplicationStepper } from '../components/ApplicationStepper';
import type {
  ApplicationDraftMember,
  ApplicationDraftPersonal,
} from '../types/applicationDraft';

function requiredDocCount(group: PriorityGroupItem | undefined): number {
  if (!group) return 0;
  return group.requiresIncomeCertificate ? 3 : 2;
}

/**
 * Bước 3/5 — Đối tượng (khớp web).
 * Tạo nháp hồ sơ BE tại đây (cần priorityGroup), rồi sang tải giấy tờ.
 */
export const PriorityGroupScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { draftPersonal, draftMembers } = route.params as {
    draftPersonal: ApplicationDraftPersonal;
    draftMembers?: ApplicationDraftMember[];
  };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [objectOptions, setObjectOptions] = useState<PriorityGroupItem[]>([]);
  const [priorityGroup, setPriorityGroup] = useState('');
  const [hasPriorContract, setHasPriorContract] = useState(false);
  const [priorContractNote, setPriorContractNote] = useState('');
  const [error, setError] = useState('');

  const selectedGroup = objectOptions.find((g) => g.code === priorityGroup);

  useEffect(() => {
    (async () => {
      try {
        const groups = await lookupApi.getPriorityGroups();
        setObjectOptions(groups);
      } catch {
        Alert.alert('Lỗi', 'Không tải được danh sách đối tượng thụ hưởng.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleContinue = async () => {
    if (!priorityGroup) {
      setError('Vui lòng chọn nhóm đối tượng thụ hưởng theo Điều 76.');
      return;
    }
    if (hasPriorContract && !priorContractNote.trim()) {
      setError('Vui lòng ghi chú lịch sử hợp đồng nhà ở xã hội.');
      return;
    }
    if (objectOptions.length === 0) {
      Alert.alert('Lỗi', 'Chưa có danh sách đối tượng. Vui lòng thử lại.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const payload: CreateApplicationRequest = {
        projectId: draftPersonal.projectId,
        fullName: draftPersonal.fullName,
        citizenId: draftPersonal.citizenId,
        permanentAddress: draftPersonal.permanentAddress,
        currentResidence: draftPersonal.currentResidence,
        occupation: draftPersonal.occupation,
        workPlace: draftPersonal.workPlace,
        housingStatus: draftPersonal.housingStatus,
        maritalStatus: draftPersonal.maritalStatus,
        priorityGroup,
        monthlyIncome: draftPersonal.monthlyIncome,
        spouseMonthlyIncome: draftPersonal.spouseMonthlyIncome,
        averageHousingAreaPerPerson: draftPersonal.averageHousingAreaPerPerson,
        householdMembers: (draftMembers || []).map((m) => ({
          fullName: m.fullName,
          citizenId: m.citizenId,
          dateOfBirth: m.dateOfBirth,
          relationship: m.relationship,
          note: m.note,
        })),
      };

      const result = await housingApplicationApi.createApplication(payload);

      // Fallback: nếu BE bỏ qua householdMembers trong create → thêm từng người
      if ((draftMembers?.length || 0) > 0) {
        try {
          const existing = await householdMemberApi.getMembers(result.applicationId);
          if (!existing.length) {
            for (const m of draftMembers!) {
              await householdMemberApi.addMember(result.applicationId, {
                fullName: m.fullName,
                citizenId: m.citizenId,
                dateOfBirth: m.dateOfBirth,
                relationship: m.relationship,
                note: m.note,
              });
            }
          }
        } catch {
          /* create đã gửi members — bỏ qua nếu API members lỗi */
        }
      }

      goToUpload(result.applicationId, result.applicationStatus || 'DRAFT');
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data || {};
      if (status === 409) {
        await resumeExistingApplication(data);
        return;
      }
      Alert.alert('Lỗi', data.message || e?.message || 'Không tạo được hồ sơ.');
    } finally {
      setSubmitting(false);
    }
  };

  const RESUMABLE = new Set(['DRAFT', 'NEED_MORE_DOCUMENTS']);

  const goToUpload = (applicationId: string, applicationStatus?: string) => {
    navigation.replace('UploadDocuments', {
      applicationId,
      projectName: draftPersonal.projectName,
      applicationStatus: applicationStatus || 'DRAFT',
    });
  };

  const resumeExistingApplication = async (data: Record<string, any>) => {
    let appId: string | undefined;
    let appStatus = '';

    try {
      const mine = await housingApplicationApi.getMyApplications();
      const existing = (mine.items || []).find(
        (a) =>
          a.projectId === draftPersonal.projectId &&
          a.applicationStatus !== 'REJECTED' &&
          a.applicationStatus !== 'CANCELED' &&
          a.applicationStatus !== 'CANCELLED',
      );
      appId = existing?.applicationId;
      appStatus = String(existing?.applicationStatus || '').toUpperCase();
    } catch {
      /* keep empty */
    }

    if (appId && RESUMABLE.has(appStatus || 'DRAFT')) {
      try {
        await housingApplicationApi.updateApplication(appId, {
          fullName: draftPersonal.fullName,
          citizenId: draftPersonal.citizenId,
          permanentAddress: draftPersonal.permanentAddress,
          currentResidence: draftPersonal.currentResidence,
          occupation: draftPersonal.occupation,
          workPlace: draftPersonal.workPlace,
          housingStatus: draftPersonal.housingStatus,
          maritalStatus: draftPersonal.maritalStatus,
          priorityGroup,
          monthlyIncome: draftPersonal.monthlyIncome,
          spouseMonthlyIncome: draftPersonal.spouseMonthlyIncome,
          averageHousingAreaPerPerson: draftPersonal.averageHousingAreaPerPerson,
        });
      } catch {
        /* vẫn vào bước giấy tờ với nháp cũ */
      }
      goToUpload(appId, appStatus || 'DRAFT');
      return;
    }

    Alert.alert(
      'Hồ sơ đã có',
      data.message || 'Bạn đã có hồ sơ cho dự án này. Mở hồ sơ hiện có để tiếp tục, không tạo mới.',
      appId
        ? [
            {
              text: 'Xem hồ sơ',
              onPress: () =>
                navigation.replace('ApplicationDetail', { applicationId: appId }),
            },
            { text: 'Đóng', style: 'cancel' },
          ]
        : [{ text: 'Đồng ý' }],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <BrandBar />
      <View style={styles.whiteHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={RHSColors.blue700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bước 3/5 — Đối tượng</Text>
        <View style={{ width: 36 }} />
      </View>
      <ApplicationStepper current={3} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.hint}>
          Kiểm tra lại nhóm đối tượng và lịch sử hợp đồng nhà ở xã hội (khớp bước 3 trên web).
          {draftPersonal.projectName ? ` Dự án: ${draftPersonal.projectName}` : ''}
        </Text>

        <Text style={styles.label}>Nhóm đối tượng ưu tiên *</Text>
        {objectOptions.length === 0 ? (
          <Text style={styles.meta}>Không tải được danh sách đối tượng.</Text>
        ) : (
          objectOptions.map((opt) => (
            <TouchableOpacity
              key={opt.code}
              style={[styles.radio, priorityGroup === opt.code && styles.radioActive]}
              onPress={() => {
                setPriorityGroup(opt.code);
                setError('');
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.radioDot, priorityGroup === opt.code && styles.radioDotActive]}>
                {priorityGroup === opt.code && <View style={styles.radioDotFill} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.radioLabel, priorityGroup === opt.code && styles.radioLabelActive]}>
                  {opt.label}
                </Text>
                {priorityGroup === opt.code && (
                  <Text style={styles.meta}>
                    Cần nộp {requiredDocCount(opt)} giấy tờ
                    {opt.requiredDocumentLabel ? ` · gồm ${opt.requiredDocumentLabel}` : ''}
                    {opt.requiresIncomeCertificate ? ' + giấy xác nhận thu nhập' : ''}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

        {selectedGroup && (
          <Text style={[styles.meta, { marginTop: 8 }]}>
            Bước giấy tờ sẽ yêu cầu đúng {requiredDocCount(selectedGroup)} file PDF theo đối tượng
            này.
          </Text>
        )}

        <View style={styles.priorCard}>
          <View style={styles.priorRow}>
            <Text style={[styles.label, { flex: 1, marginTop: 0 }]}>
              Đã từng ký hợp đồng mua nhà ở xã hội trước đây?
            </Text>
            <Switch
              value={hasPriorContract}
              onValueChange={setHasPriorContract}
              trackColor={{ false: '#D1D5DB', true: RHSColors.blue700 }}
            />
          </View>
          <Text style={styles.label}>
            {hasPriorContract ? 'Ghi chú lịch sử *' : 'Ghi chú lịch sử'}
          </Text>
          <TextInput
            style={[styles.input, !hasPriorContract && styles.inputDisabled]}
            value={priorContractNote}
            onChangeText={setPriorContractNote}
            placeholder="Ví dụ: chưa từng / đã ký năm …"
            placeholderTextColor={RHSColors.textMuted}
            editable={hasPriorContract}
            maxLength={500}
            multiline
          />
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        <TouchableOpacity
          style={[styles.continueBtn, submitting && { opacity: 0.7 }]}
          onPress={() => void handleContinue()}
          disabled={submitting}
          activeOpacity={0.9}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.continueBtnText}>Lưu nháp & tải giấy tờ</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  whiteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
  },
  backBtn: { padding: 4, marginRight: 10 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: RHSColors.blue700 },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  hint: { ...typography.body, color: RHSColors.textMuted, marginBottom: spacing.md },
  label: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text, marginTop: 12, marginBottom: 8 },
  meta: { ...typography.caption, color: RHSColors.textMuted, marginTop: 4 },
  radio: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  radioActive: { borderColor: RHSColors.blue700, backgroundColor: RHSColors.blue50 },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: RHSColors.grey300,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDotActive: { borderColor: RHSColors.blue700 },
  radioDotFill: { width: 10, height: 10, borderRadius: 5, backgroundColor: RHSColors.blue700 },
  radioLabel: { ...typography.bodySmall, color: RHSColors.text },
  radioLabelActive: { fontWeight: '700', color: RHSColors.blue700 },
  priorCard: {
    marginTop: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: RHSColors.border,
    padding: spacing.lg,
  },
  priorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: RHSColors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    color: RHSColors.text,
    backgroundColor: RHSColors.surface,
  },
  inputDisabled: { opacity: 0.5 },
  error: { ...typography.caption, color: RHSColors.red600, marginTop: spacing.md },
  bottomBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: RHSColors.border,
    padding: spacing.md,
  },
  continueBtn: {
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.md,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
