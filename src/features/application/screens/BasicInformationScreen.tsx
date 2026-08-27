import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
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
import { RHSColors, borderRadius, typography, spacing } from '../../../lib/theme';
import { housingApplicationApi } from '../api/housingApplicationApi';
import { ApplicationStepper } from '../components/ApplicationStepper';
import { getHousingStatusLabel, getMaritalStatusLabel } from '../utils/statusConfig';
import { citizenProfileApi, type ApplicationPrefillDto } from '../../user/api/citizenProfileApi';
import { getCitizenProfileReadyGaps } from '../../user/utils/ekycGate';
import { formatVnd, getRelationshipLabel } from '../../user/types/citizenProfile';
import type { EligibilityResult } from '../types/application';

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN');
}

/**
 * Bước 1/4 — Xác nhận hồ sơ công dân (kế thừa, không nhập lại).
 */
export const BasicInformationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { projectId, projectName } = route.params as {
    projectId: string;
    projectName?: string;
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
  const [prefill, setPrefill] = useState<ApplicationPrefillDto | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [gaps, setGaps] = useState<string[]>([]);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);

  const openCitizenHub = useCallback(() => {
    navigation.getParent()?.getParent()?.navigate('UserProfile', {
      screen: 'CitizenProfileHub',
    });
  }, [navigation]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [full, prefillData, active, elig] = await Promise.all([
        citizenProfileApi.getFullProfile(),
        citizenProfileApi.getPrefill(),
        housingApplicationApi.activeCheck().catch(() => null),
        citizenProfileApi.checkEligibility().catch(() => null),
      ]);

      if (active?.hasActiveApplication) {
        setActiveBlock(
          active.message ||
            'Bạn đang có hồ sơ khác đang xử lý. Mỗi người chỉ được một hồ sơ hoạt động tại một thời điểm.',
        );
      } else {
        setActiveBlock(null);
      }

      setPrefill(prefillData);
      setEligibility(elig);
      setGaps(getCitizenProfileReadyGaps(full));
    } catch (e: any) {
      appAlert('Lỗi', e?.response?.data?.message || 'Không tải được hồ sơ công dân.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleContinue = () => {
    if (activeBlock) {
      appAlert('Không thể tạo hồ sơ', activeBlock);
      return;
    }
    if (gaps.length > 0) {
      appAlert(
        'Hồ sơ chưa đủ',
        gaps.join('\n'),
        [
          { text: 'Đóng', style: 'cancel' },
          { text: 'Hoàn thiện hồ sơ', onPress: openCitizenHub },
        ],
      );
      return;
    }
    if (!prefill?.isEkycVerified && !prefill?.citizenId?.trim()) {
      appAlert('Chưa xác minh danh tính', 'Vui lòng hoàn tất xác minh danh tính trước khi đăng ký.');
      return;
    }
    navigation.navigate('PriorityGroup', {
      projectId,
      projectName,
      suggestedPriorityGroup: prefill?.priorityGroup || undefined,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandBar />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <View style={styles.whiteHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={RHSColors.blue700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bước 1/4 — Xác nhận hồ sơ</Text>
        <View style={{ width: 36 }} />
      </View>
      <ApplicationStepper current={1} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!!projectName && (
          <Text style={styles.project}>Dự án: {projectName}</Text>
        )}

        {!!activeBlock && (
          <View style={styles.warnBox}>
            <Feather name="alert-circle" size={16} color={RHSColors.amber700} />
            <Text style={styles.warnText}>{activeBlock}</Text>
          </View>
        )}

        {gaps.length > 0 && (
          <View style={styles.warnBox}>
            <Feather name="alert-triangle" size={16} color={RHSColors.amber700} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warnText}>Cần hoàn thiện hồ sơ công dân trước khi đăng ký:</Text>
              {gaps.map((g) => (
                <Text key={g} style={styles.gapItem}>
                  • {g}
                </Text>
              ))}
              <TouchableOpacity onPress={openCitizenHub} style={styles.linkBtn}>
                <Text style={styles.linkText}>Mở hồ sơ công dân</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Section title="Định danh (đã khóa)">
          <Row label="Họ và tên" value={prefill?.fullName} />
          <Row label="Số CCCD" value={prefill?.citizenId} />
          <Row label="Ngày sinh" value={formatDate(prefill?.dateOfBirth)} />
          <Row
            label="Xác thực eKYC"
            value={prefill?.isEkycVerified ? 'Đã xác thực' : 'Chưa xác thực'}
          />
        </Section>

        <Section title="Nhân thân">
          <Row label="Hôn nhân" value={getMaritalStatusLabel(prefill?.maritalStatus)} />
          <Row label="Nghề nghiệp" value={prefill?.occupation} />
          <Row label="Nơi làm việc" value={prefill?.workPlace} />
          <Row label="Thu nhập tháng" value={formatVnd(prefill?.monthlyIncome)} />
          {prefill?.maritalStatus?.toUpperCase() === 'MARRIED' && (
            <Row
              label="Thu nhập vợ/chồng"
              value={formatVnd(prefill?.spouseMonthlyIncome)}
            />
          )}
        </Section>

        <Section title="Nơi ở">
          <Row label="Thường trú" value={prefill?.permanentAddress} />
          <Row label="Nơi ở hiện tại" value={prefill?.currentResidence} />
          <Row
            label="Thực trạng nhà"
            value={getHousingStatusLabel(prefill?.housingStatus || '')}
          />
          {prefill?.housingStatus?.toUpperCase() === 'SMALL_HOUSE' && (
            <Row
              label="Diện tích bình quân"
              value={
                prefill.averageHousingAreaPerPerson != null
                  ? `${prefill.averageHousingAreaPerPerson} m²/người`
                  : '—'
              }
            />
          )}
        </Section>

        <Section title={`Hộ gia đình (${prefill?.householdMembersCount ?? 1} nhân khẩu)`}>
          {(prefill?.householdMembers || []).length === 0 ? (
            <Text style={styles.empty}>Chỉ có bạn (chủ hộ). Không có thành viên khác.</Text>
          ) : (
            (prefill?.householdMembers || []).map((m, i) => (
              <View key={`${m.citizenId || m.fullName}-${i}`} style={styles.member}>
                <Text style={styles.memberName}>{m.fullName}</Text>
                <Text style={styles.memberMeta}>
                  {getRelationshipLabel(m.relationship || '')}
                  {m.isDependent ? ' · Người phụ thuộc' : ''}
                  {m.citizenId ? ` · CCCD ${m.citizenId}` : ''}
                </Text>
              </View>
            ))
          )}
        </Section>

        <Section title="Giấy tờ trong kho">
          {(prefill?.availableVaultDocuments || []).length === 0 ? (
            <Text style={styles.empty}>
              Chưa có giấy trong kho. Hệ thống sẽ yêu cầu tải lên ở bước giấy tờ theo nhóm đối tượng.
            </Text>
          ) : (
            (prefill?.availableVaultDocuments || []).map((d) => (
              <Text key={d.documentId} style={styles.docLine}>
                {d.documentTypeLabel || d.documentType} — {d.fileName}
              </Text>
            ))
          )}
        </Section>

        {eligibility && (
          <View
            style={[
              styles.eligBox,
              {
                backgroundColor: eligibility.eligible ? RHSColors.green50 : RHSColors.amber50,
              },
            ]}
          >
            <Text
              style={[
                styles.eligTitle,
                { color: eligibility.eligible ? RHSColors.green700 : RHSColors.amber700 },
              ]}
            >
              {eligibility.eligible
                ? 'Ước lượng: đủ điều kiện theo hồ sơ hiện tại'
                : 'Ước lượng: chưa đủ điều kiện — vẫn có thể tạo nháp'}
            </Text>
            {!!eligibility.summaryMessage && (
              <Text style={styles.eligSummary}>{eligibility.summaryMessage}</Text>
            )}
            {(eligibility.reasons || []).slice(0, 4).map((r) => (
              <Text key={r} style={styles.eligReason}>
                • {r}
              </Text>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.editLink} onPress={openCitizenHub}>
          <Feather name="edit-2" size={14} color={RHSColors.blue700} />
          <Text style={styles.linkText}>Sửa trên hồ sơ công dân</Text>
        </TouchableOpacity>
      </ScrollView>

      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        <TouchableOpacity
          style={[
            styles.continueBtn,
            (gaps.length > 0 || !!activeBlock) && styles.continueDisabled,
          ]}
          onPress={handleContinue}
          disabled={gaps.length > 0 || !!activeBlock}
        >
          <Text style={styles.continueText}>Tiếp tục chọn đối tượng</Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaView>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value?.trim() ? value : '—'}</Text>
  </View>
);

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
  content: { padding: spacing.lg, paddingBottom: 24 },
  project: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text, marginBottom: 12 },
  warnBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: RHSColors.amber50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  warnText: { fontSize: 13, color: RHSColors.amber700, fontWeight: '600', lineHeight: 18 },
  gapItem: { fontSize: 13, color: RHSColors.amber700, marginTop: 4, lineHeight: 18 },
  linkBtn: { marginTop: 8 },
  linkText: { color: RHSColors.blue700, fontWeight: '700', fontSize: 13 },
  section: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: RHSColors.text, marginBottom: 10 },
  row: { marginBottom: 8 },
  rowLabel: { fontSize: 12, color: RHSColors.textMuted },
  rowValue: { fontSize: 14, fontWeight: '600', color: RHSColors.text, marginTop: 2 },
  empty: { fontSize: 13, color: RHSColors.textMuted, lineHeight: 18 },
  member: { marginBottom: 8 },
  memberName: { fontSize: 14, fontWeight: '700', color: RHSColors.text },
  memberMeta: { fontSize: 12, color: RHSColors.textSecondary, marginTop: 2 },
  docLine: { fontSize: 13, color: RHSColors.text, marginBottom: 4 },
  eligBox: { borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  eligTitle: { fontSize: 14, fontWeight: '800', marginBottom: 6 },
  eligSummary: { fontSize: 13, color: RHSColors.text, lineHeight: 18, marginBottom: 6 },
  eligReason: { fontSize: 12, color: RHSColors.textSecondary, lineHeight: 18 },
  editLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginBottom: 8 },
  bottomBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: RHSColors.border,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
  },
  continueDisabled: { opacity: 0.45 },
  continueText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
