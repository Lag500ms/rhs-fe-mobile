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
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { BrandBar } from '../../../components/BrandBar';
import { RHSColors, borderRadius, spacing, typography, shadows } from '../../../lib/theme';
import { appAlert } from '../../../lib/appDialog';
import { citizenProfileApi } from '../api/citizenProfileApi';
import type { CitizenFullProfileDto } from '../types/citizenProfile';
import { formatVnd } from '../types/citizenProfile';
import {
  getCitizenProfileCompleteness,
  isEkycVerified,
} from '../utils/ekycGate';

type StepKey = 'identity' | 'personal' | 'household' | 'documents';

export const CitizenProfileHubScreen = () => {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<CitizenFullProfileDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await citizenProfileApi.getFullProfile();
      setProfile(data);
    } catch (e: any) {
      appAlert('Lỗi', e?.response?.data?.message || 'Không tải được hồ sơ công dân.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const completeness = getCitizenProfileCompleteness(profile);
  const verified = isEkycVerified(profile);

  const openStep = (key: StepKey) => {
    if (key === 'identity') {
      if (verified) {
        appAlert('Đã xác thực', 'Danh tính đã được khóa sau khi xác minh. Không thể sửa CCCD hay họ tên.');
        return;
      }
      navigation.getParent()?.navigate('EKyc');
      return;
    }
    if (!verified) {
      appAlert('Cần xác minh danh tính', 'Vui lòng xác minh danh tính trước khi hoàn thiện hồ sơ.', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xác minh', onPress: () => navigation.getParent()?.navigate('EKyc') },
      ]);
      return;
    }
    if (key === 'personal') navigation.navigate('CitizenPersonalInfo');
    if (key === 'household') navigation.navigate('CitizenHousehold');
    if (key === 'documents') navigation.navigate('CitizenDocuments');
  };

  const steps: {
    key: StepKey;
    title: string;
    subtitle: string;
    done: boolean;
    icon: keyof typeof Feather.glyphMap;
  }[] = [
    {
      key: 'identity',
      title: 'Định danh',
      subtitle: verified ? 'Đã xác thực CCCD' : 'Chưa xác minh danh tính',
      done: completeness.identity,
      icon: 'shield',
    },
    {
      key: 'personal',
      title: 'Thông tin nhân thân',
      subtitle: 'Hôn nhân · Thu nhập · Nhà ở',
      done: completeness.personal,
      icon: 'user',
    },
    {
      key: 'household',
      title: 'Hộ gia đình',
      subtitle: `${profile?.householdMembersCount ?? 1} nhân khẩu · ${profile?.dependentMembersCount ?? 0} phụ thuộc`,
      done: completeness.household,
      icon: 'users',
    },
    {
      key: 'documents',
      title: 'Kho giấy tờ',
      subtitle:
        (profile?.missingDocumentTypes?.length ?? 0) > 0
          ? `Thiếu ${profile!.missingDocumentTypes.length} loại bắt buộc`
          : 'Đủ giấy tờ theo hồ sơ',
      done: completeness.documents,
      icon: 'folder',
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <ScreenHeader title="Hồ sơ công dân" isWhite />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Text style={styles.heroName}>{profile?.fullName || 'Công dân'}</Text>
            <Text style={styles.heroMeta}>
              CCCD: {profile?.citizenId || 'Chưa có'}
            </Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: verified ? RHSColors.green50 : RHSColors.amber50 },
              ]}
            >
              <Feather
                name={verified ? 'check-circle' : 'alert-circle'}
                size={14}
                color={verified ? RHSColors.green700 : RHSColors.amber700}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: verified ? RHSColors.green700 : RHSColors.amber700 },
                ]}
              >
                {verified ? 'Đã xác thực' : 'Chưa xác thực'}
              </Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Hoàn thiện hồ sơ</Text>
              <Text style={styles.progressPct}>{completeness.percent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completeness.percent}%` }]} />
            </View>

            <View style={styles.statsRow}>
              <Stat label="Nhân khẩu" value={`${profile?.householdMembersCount ?? 1}`} />
              <Stat label="Phụ thuộc" value={`${profile?.dependentMembersCount ?? 0}`} />
              <Stat
                label="Thu nhập tính"
                value={formatVnd(profile?.countableHouseholdIncome)}
              />
            </View>
          </View>

          {steps.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={styles.stepCard}
              onPress={() => openStep(s.key)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.stepIcon,
                  { backgroundColor: s.done ? RHSColors.green50 : RHSColors.blue50 },
                ]}
              >
                <Feather
                  name={s.icon}
                  size={18}
                  color={s.done ? RHSColors.green700 : RHSColors.blue700}
                />
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepSub}>{s.subtitle}</Text>
              </View>
              <View style={styles.stepRight}>
                <Text
                  style={[
                    styles.stepStatus,
                    { color: s.done ? RHSColors.green700 : RHSColors.amber700 },
                  ]}
                >
                  {s.done ? 'Đủ' : 'Thiếu'}
                </Text>
                <Feather name="chevron-right" size={18} color={RHSColors.grey400} />
              </View>
            </TouchableOpacity>
          ))}

          <Text style={styles.hint}>
            Hoàn thành 4 bước để tái sử dụng khi nộp hồ sơ nhà ở xã hội. Phần xác minh danh tính
            không thay đổi trong luồng này.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue} numberOfLines={1}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, paddingBottom: 40 },
  heroCard: {
    backgroundColor: RHSColors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  heroName: { ...typography.h2, color: RHSColors.text },
  heroMeta: { ...typography.bodySmall, color: RHSColors.textSecondary, marginTop: 4 },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: 6,
  },
  progressLabel: { ...typography.caption, color: RHSColors.textSecondary, fontWeight: '600' },
  progressPct: { ...typography.caption, color: RHSColors.blue700, fontWeight: '800' },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: RHSColors.grey200,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: RHSColors.blue700 },
  statsRow: { flexDirection: 'row', marginTop: spacing.xl, gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: RHSColors.grey50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  statValue: { fontSize: 13, fontWeight: '800', color: RHSColors.text },
  statLabel: { fontSize: 11, color: RHSColors.textMuted, marginTop: 2 },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBody: { flex: 1, marginLeft: spacing.md },
  stepTitle: { fontSize: 15, fontWeight: '700', color: RHSColors.text },
  stepSub: { fontSize: 12, color: RHSColors.textSecondary, marginTop: 2 },
  stepRight: { alignItems: 'flex-end', gap: 4 },
  stepStatus: { fontSize: 12, fontWeight: '700' },
  hint: {
    ...typography.caption,
    color: RHSColors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
