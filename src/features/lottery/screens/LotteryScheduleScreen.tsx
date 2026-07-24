import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { RHSColors, spacing, borderRadius, typography } from '../../../lib/theme';
import { lotteryApi } from '../api/lotteryApi';
import {
  LOTTERY_TYPE_LABEL,
  type LotteryScheduleDetail,
} from '../types/lottery';
import { getToken } from '../../../lib/tokenStorage';

type RouteParams = {
  projectId: string;
  projectName?: string;
  applicationId?: string;
};

function formatDateTime(iso?: string | null): string {
  if (!iso) return 'Chưa công bố';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const LotteryScheduleScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { projectId, projectName, applicationId } = (route.params ?? {}) as RouteParams;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [schedule, setSchedule] = useState<LotteryScheduleDetail | null>(null);

  const load = useCallback(async () => {
    if (!projectId) {
      setError('Thiếu mã dự án.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await lotteryApi.getSchedule(projectId);
      setSchedule(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không tải được lịch bốc thăm.');
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openLocation = async () => {
    const loc = schedule?.lotteryLocation?.trim();
    if (!loc) return;
    if (/^https?:\/\//i.test(loc)) {
      await Linking.openURL(loc);
      return;
    }
    Alert.alert('Địa điểm bốc thăm', loc);
  };

  const goLobby = async () => {
    const token = await getToken();
    if (!token) {
      Alert.alert('Đăng nhập', 'Vui lòng đăng nhập để vào sảnh bốc thăm.');
      return;
    }
    if (!schedule?.isLotteryApproved && !schedule?.lotteryDate) {
      Alert.alert('Chưa sẵn sàng', 'Lịch bốc thăm chưa được công bố.');
      return;
    }
    navigation.navigate('LotteryLobby', {
      projectId,
      projectName: schedule?.projectName || projectName,
      applicationId,
    });
  };

  const goResult = () => {
    navigation.navigate('LotteryResult', {
      projectId,
      projectName: schedule?.projectName || projectName,
      applicationId,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Lịch bốc thăm" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={RHSColors.blue700} />
            <Text style={styles.muted}>Đang tải lịch...</Text>
          </View>
        )}
        {!!error && !loading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => void load()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}
        {schedule && !loading && (
          <>
            <Text style={styles.projectName}>{schedule.projectName || projectName || 'Dự án'}</Text>

            <View style={styles.card}>
              <Row icon="calendar" label="Thời gian" value={formatDateTime(schedule.lotteryDate)} />
              <Row
                icon="map-pin"
                label="Địa điểm / kênh"
                value={schedule.lotteryLocation || 'Chưa công bố'}
                onPress={schedule.lotteryLocation ? openLocation : undefined}
              />
              <Row
                icon="monitor"
                label="Hình thức"
                value={
                  LOTTERY_TYPE_LABEL[schedule.lotteryType ?? ''] ??
                  schedule.lotteryType ??
                  '—'
                }
              />
              <Row
                icon="check-circle"
                label="Phê duyệt lịch"
                value={
                  schedule.isLotteryApproved
                    ? `Đã duyệt${schedule.lotteryApprovedAt ? ` · ${formatDateTime(schedule.lotteryApprovedAt)}` : ''}`
                    : 'Chưa duyệt / chưa công bố'
                }
              />
              <Row icon="home" label="Số căn phân bổ" value={String(schedule.availableUnits)} />
              <Row
                icon="users"
                label="Hồ sơ đủ điều kiện"
                value={String(schedule.totalEligibleParticipants)}
              />
            </View>

            {!!schedule.lotteryDescription && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Hướng dẫn tham dự</Text>
                <Text style={styles.desc}>{schedule.lotteryDescription}</Text>
              </View>
            )}

            <View style={styles.hint}>
              <Feather name="info" size={16} color={RHSColors.blue700} />
              <Text style={styles.hintText}>
                Khi đến giờ, vào sảnh chờ để tham gia. Kết quả được ghi nhận công khai; Sở Xây dựng
                giám sát phiên bốc thăm.
              </Text>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => void goLobby()} activeOpacity={0.9}>
              <Feather name="radio" size={18} color="#fff" />
              <Text style={styles.primaryText}>Vào sảnh bốc thăm</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={goResult} activeOpacity={0.9}>
              <Feather name="award" size={18} color={RHSColors.blue700} />
              <Text style={styles.secondaryText}>Xem kết quả đã công bố</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

function Row({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const inner = (
    <>
      <View style={styles.rowLeft}>
        <Feather name={icon} size={16} color={RHSColors.blue700} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={[styles.rowValue, onPress && styles.link]}>{value}</Text>
    </>
  );
  if (onPress) {
    return (
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
        {inner}
      </TouchableOpacity>
    );
  }
  return <View style={styles.row}>{inner}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  content: { padding: spacing.lg, paddingBottom: 40 },
  center: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  muted: { ...typography.body, color: RHSColors.textMuted },
  errorBox: {
    backgroundColor: RHSColors.red50,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: 10,
  },
  errorText: { color: RHSColors.red700, ...typography.body },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
  },
  retryText: { color: RHSColors.blue700, fontWeight: '600' },
  projectName: {
    ...typography.h2,
    color: RHSColors.text,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 12,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  sectionTitle: { ...typography.h3, color: RHSColors.text, marginBottom: 6 },
  desc: { ...typography.body, color: RHSColors.textMuted, lineHeight: 22 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  rowLabel: { ...typography.caption, color: RHSColors.textMuted },
  rowValue: { ...typography.body, color: RHSColors.text, flex: 1, textAlign: 'right' },
  link: { color: RHSColors.blue700, textDecorationLine: 'underline' },
  hint: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: RHSColors.blue50,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  hintText: { flex: 1, ...typography.caption, color: RHSColors.blue700, lineHeight: 18 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    marginBottom: 10,
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: RHSColors.blue700,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
  },
  secondaryText: { color: RHSColors.blue700, fontWeight: '700', fontSize: 15 },
});
