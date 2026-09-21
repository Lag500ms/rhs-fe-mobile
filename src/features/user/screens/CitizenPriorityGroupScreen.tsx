import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { BrandBar } from '../../../components/BrandBar';
import { RHSColors, borderRadius, spacing, typography, shadows } from '../../../lib/theme';
import { appAlert } from '../../../lib/appDialog';
import { citizenProfileApi } from '../api/citizenProfileApi';
import { lookupApi } from '../../application/api/lookupApi';
import type { CitizenFullProfileDto } from '../types/citizenProfile';
import type { PriorityGroupItem } from '../../application/types/application';
import { formatPriorityGroup } from '../../../lib/priorityGroup';

function requiredDocCount(group: PriorityGroupItem | undefined): number {
  if (!group) return 0;
  return group.requiresIncomeCertificate ? 3 : 2;
}

export const CitizenPriorityGroupScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CitizenFullProfileDto | null>(null);
  const [groups, setGroups] = useState<PriorityGroupItem[]>([]);
  const [priorityGroup, setPriorityGroup] = useState('');

  const selected = groups.find((g) => g.code === priorityGroup);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, list] = await Promise.all([
        citizenProfileApi.getFullProfile(),
        lookupApi.getPriorityGroups(),
      ]);
      setProfile(p);
      setGroups(list);
      const saved = (p.priorityGroup || '').trim().toUpperCase();
      if (saved && list.some((g) => g.code === saved)) {
        setPriorityGroup(saved);
      }
    } catch (e: any) {
      appAlert('Lỗi', e?.response?.data?.message || 'Không tải được nhóm đối tượng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSave = async () => {
    if (!priorityGroup) {
      appAlert('Thiếu thông tin', 'Vui lòng chọn nhóm đối tượng hưởng chính sách (Điều 76).');
      return;
    }

    setSaving(true);
    try {
      const updated = await citizenProfileApi.updateCitizenProfile({ priorityGroup });
      setProfile(updated);
      appAlert(
        'Thành công',
        'Đã lưu nhóm đối tượng. Giấy tờ bắt buộc theo đối tượng nằm ở Kho giấy tờ — lúc nộp hồ sơ chỉ xác nhận lại.',
        [
          { text: 'Đóng', onPress: () => navigation.goBack() },
          {
            text: 'Kho giấy tờ',
            onPress: () => navigation.navigate('CitizenDocuments'),
          },
        ],
      );
    } catch (e: any) {
      appAlert('Lỗi', e?.response?.data?.message || 'Không lưu được nhóm đối tượng.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandBar />
        <ScreenHeader title="Đối tượng ưu tiên" isWhite />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <ScreenHeader title="Đối tượng ưu tiên" isWhite />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Chọn nhóm đối tượng hưởng chính sách nhà ở xã hội (Điều 76 Luật Nhà ở 2023). Mục này thuộc
          hồ sơ công dân — khi nộp hồ sơ dự án bạn chỉ xác nhận lại, không kê khai từ đầu.
        </Text>
        {!!(profile?.priorityGroupLabel || profile?.priorityGroup) && (
          <Text style={styles.hint}>
            Đang lưu:{' '}
            {formatPriorityGroup(profile?.priorityGroupLabel) ||
              formatPriorityGroup(profile?.priorityGroup)}
          </Text>
        )}
        <Text style={styles.hint}>Chọn đúng nhóm khớp với giấy tờ ưu tiên sẽ tải ở Kho giấy tờ.</Text>

        {groups.length === 0 ? (
          <Text style={styles.meta}>Không tải được danh sách đối tượng.</Text>
        ) : (
          groups.map((opt) => {
            const active = priorityGroup === opt.code;
            return (
              <TouchableOpacity
                key={opt.code}
                style={[styles.radio, active && styles.radioActive]}
                onPress={() => setPriorityGroup(opt.code)}
                activeOpacity={0.7}
              >
                <View style={[styles.radioDot, active && styles.radioDotActive]}>
                  {active && <View style={styles.radioDotFill} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.radioLabel, active && styles.radioLabelActive]}>
                    {opt.label}
                  </Text>
                  {active && (
                    <Text style={styles.meta}>
                      Cần {requiredDocCount(opt)} giấy tờ
                      {opt.requiredDocumentLabel ? ` · gồm ${opt.requiredDocumentLabel}` : ''}
                      {opt.requiresIncomeCertificate ? ' + giấy xác nhận thu nhập' : ''}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {selected && (
          <Text style={styles.footerHint}>
            Sau khi lưu, hãy tải giấy tờ theo đối tượng trong Kho giấy tờ để lần nộp hồ sơ kế thừa
            sẵn.
          </Text>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={() => void handleSave()}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Lưu nhóm đối tượng</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, paddingBottom: 48 },
  intro: { ...typography.body, color: RHSColors.text, lineHeight: 20, marginBottom: spacing.sm },
  hint: { fontSize: 13, color: RHSColors.textMuted, lineHeight: 18, marginBottom: spacing.md },
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
    ...shadows.sm,
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
  footerHint: {
    fontSize: 12,
    color: RHSColors.textMuted,
    lineHeight: 18,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  saveBtn: {
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
