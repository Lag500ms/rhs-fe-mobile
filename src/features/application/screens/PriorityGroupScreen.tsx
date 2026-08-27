import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { appAlert } from '../../../lib/appDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BrandBar } from '../../../components/BrandBar';
import { RHSColors, borderRadius, spacing, typography } from '../../../lib/theme';
import { housingApplicationApi } from '../api/housingApplicationApi';
import { lookupApi } from '../api/lookupApi';
import { CreateApplicationRequest, PriorityGroupItem } from '../types/application';
import { ApplicationStepper } from '../components/ApplicationStepper';

function requiredDocCount(group: PriorityGroupItem | undefined): number {
  if (!group) return 0;
  return group.requiresIncomeCertificate ? 3 : 2;
}

/**
 * Bước 2/4 — Chọn đối tượng thụ hưởng, tạo nháp bằng cách kế thừa hồ sơ công dân.
 */
export const PriorityGroupScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { projectId, projectName, suggestedPriorityGroup } = route.params as {
    projectId: string;
    projectName?: string;
    suggestedPriorityGroup?: string;
  };

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
  const [objectOptions, setObjectOptions] = useState<PriorityGroupItem[]>([]);
  const [priorityGroup, setPriorityGroup] = useState('');
  const [error, setError] = useState('');

  const selectedGroup = objectOptions.find((g) => g.code === priorityGroup);

  useEffect(() => {
    (async () => {
      try {
        const groups = await lookupApi.getPriorityGroups();
        setObjectOptions(groups);
        const suggested = (suggestedPriorityGroup || '').trim().toUpperCase();
        if (suggested && groups.some((g) => g.code === suggested)) {
          setPriorityGroup(suggested);
        }
      } catch {
        appAlert('Lỗi', 'Không tải được danh sách đối tượng thụ hưởng.');
      } finally {
        setLoading(false);
      }
    })();
  }, [suggestedPriorityGroup]);

  const goToUpload = (applicationId: string, applicationStatus?: string) => {
    navigation.replace('UploadDocuments', {
      applicationId,
      projectName,
      applicationStatus: applicationStatus || 'DRAFT',
    });
  };

  const handleContinue = async () => {
    if (!priorityGroup) {
      setError('Vui lòng chọn nhóm đối tượng thụ hưởng theo Điều 76.');
      return;
    }
    if (objectOptions.length === 0) {
      appAlert('Lỗi', 'Chưa có danh sách đối tượng. Vui lòng thử lại.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const payload: CreateApplicationRequest = {
        projectId,
        priorityGroup,
        autoFillFromProfile: true,
        inheritDocumentsFromVault: true,
      };

      const result = await housingApplicationApi.createApplication(payload);
      goToUpload(result.applicationId, result.applicationStatus || 'DRAFT');
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data || {};
      if (status === 409) {
        await resumeExistingApplication(data);
        return;
      }
      appAlert('Lỗi', data.message || e?.message || 'Không tạo được hồ sơ.');
    } finally {
      setSubmitting(false);
    }
  };

  const RESUMABLE = new Set(['DRAFT', 'NEED_MORE_DOCUMENTS']);

  const resumeExistingApplication = async (data: Record<string, any>) => {
    let appId: string | undefined;
    let appStatus = '';

    try {
      const mine = await housingApplicationApi.getMyApplications();
      const existing = (mine.items || []).find(
        (a) =>
          a.projectId === projectId &&
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
        const detail = await housingApplicationApi.getApplicationDetail(appId);
        await housingApplicationApi.updateApplication(appId, {
          fullName: detail.fullName,
          citizenId: detail.citizenId,
          occupation: detail.occupation || undefined,
          workPlace: detail.workPlace || undefined,
          currentResidence: detail.currentResidence,
          permanentAddress: detail.permanentAddress,
          housingStatus: detail.housingStatus,
          maritalStatus: detail.maritalStatus || 'SINGLE',
          priorityGroup,
          monthlyIncome: detail.monthlyIncome ?? undefined,
          spouseMonthlyIncome: detail.spouseMonthlyIncome ?? undefined,
          averageHousingAreaPerPerson: detail.averageHousingAreaPerPerson ?? undefined,
        });
      } catch {
        /* vẫn vào bước giấy tờ với nháp cũ */
      }
      goToUpload(appId, appStatus || 'DRAFT');
      return;
    }

    appAlert(
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
        <Text style={styles.headerTitle}>Bước 2/4 — Đối tượng</Text>
        <View style={{ width: 36 }} />
      </View>
      <ApplicationStepper current={2} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.hint}>
          Chọn nhóm đối tượng thụ hưởng. Hệ thống sẽ tạo hồ sơ nháp, sao chép nhân thân, hộ gia đình
          và giấy tờ hợp lệ từ hồ sơ công dân.
          {projectName ? ` Dự án: ${projectName}` : ''}
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
            Bước giấy tờ sẽ yêu cầu đúng {requiredDocCount(selectedGroup)} tệp PDF theo đối tượng này.
            Giấy đã có trong kho sẽ được kế thừa nếu khớp loại.
          </Text>
        )}

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
              <Text style={styles.continueBtnText}>Tạo nháp & tải giấy tờ</Text>
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
