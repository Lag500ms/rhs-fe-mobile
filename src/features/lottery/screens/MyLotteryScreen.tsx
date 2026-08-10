import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { RHSColors, borderRadius, spacing, typography } from '../../../lib/theme';
import { housingApplicationApi } from '../../application/api/housingApplicationApi';
import type { ApplicationSummary } from '../../application/types/application';
import {
  hasLotterySession,
  isLotteryFinishedPhase,
  isLotteryLivePhase,
  normalizeLotterySession,
} from '../../application/utils/lotterySession';
import { lotteryApi } from '../api/lotteryApi';
import {
  LOTTERY_RESULT_LABEL,
  LOTTERY_SESSION_LABEL,
  type LotteryDrawResult,
  type LotteryScheduleDetail,
} from '../types/lottery';

type Row = {
  application: ApplicationSummary;
  schedule: LotteryScheduleDetail;
  result: LotteryDrawResult | null;
};

const ELIGIBLE = new Set(['APPROVED', 'APPROVED_BY_TIMEOUT', 'PROPOSED']);

function findOwnResult(row: Row) {
  const me = row.application.applicationId;
  const pools = [
    row.result?.participants,
    row.result?.winners,
    row.result?.losers,
  ];
  for (const pool of pools) {
    const hit = pool?.find((p) => p.applicationId === me);
    if (hit) return hit;
  }
  return null;
}

export const MyLotteryScreen = () => {
  const navigation = useNavigation<any>();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [info, setInfo] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setInfo('');
    try {
      const data = await housingApplicationApi.getMyApplications();
      const apps = data.items || [];
      const eligible = apps.filter((a) =>
        ELIGIBLE.has(String(a.applicationStatus || '').toUpperCase()),
      );
      if (eligible.length === 0) {
        setRows([]);
        setInfo(
          apps.length === 0
            ? 'Bạn chưa có hồ sơ nào. Hãy tạo và nộp hồ sơ trước khi tham gia bốc thăm.'
            : 'Chưa có hồ sơ đủ điều kiện bốc thăm. Hồ sơ cần được duyệt trước.',
        );
        return;
      }

      const enriched = await Promise.all(
        eligible.map(async (app) => {
          let schedule: LotteryScheduleDetail | null = null;
          let result: LotteryDrawResult | null = null;
          try {
            schedule = await lotteryApi.getSchedule(app.projectId);
          } catch {
            schedule = null;
          }
          try {
            result = await lotteryApi.getResult(app.projectId);
          } catch {
            result = null;
          }
          return { application: app, schedule, result };
        }),
      );

      // Chỉ hiện khi CĐT đã lên lịch / mở phiên
      const withSession = enriched.filter(
        (r): r is Row => !!r.schedule && hasLotterySession(r.schedule),
      ) as Row[];

      setRows(withSession);
      if (withSession.length === 0) {
        setInfo(
          'Chủ đầu tư chưa lên lịch bốc thăm cho hồ sơ đã duyệt của bạn. Khi có lịch, mục này sẽ hiện tại đây.',
        );
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || err?.message || 'Không tải được danh sách.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  const enterLobby = (row: Row) => {
    navigation.navigate('LotteryLobby', {
      projectId: row.application.projectId,
      projectName: row.application.projectName,
      applicationId: row.application.applicationId,
    });
  };

  const openSchedule = (row: Row) => {
    navigation.navigate('LotterySchedule', {
      projectId: row.application.projectId,
      projectName: row.application.projectName,
      applicationId: row.application.applicationId,
    });
  };

  const openResult = (row: Row) => {
    navigation.navigate('LotteryResult', {
      projectId: row.application.projectId,
      projectName: row.application.projectName,
      applicationId: row.application.applicationId,
    });
  };

  const openLive = (row: Row) => {
    navigation.navigate('LotteryLive', {
      projectId: row.application.projectId,
      projectName: row.application.projectName,
      applicationId: row.application.applicationId,
    });
  };

  const renderItem = ({ item }: { item: Row }) => {
    const phase = normalizeLotterySession(item.schedule.sessionStatus);
    const phaseLabel = LOTTERY_SESSION_LABEL[phase] ?? LOTTERY_SESSION_LABEL[item.schedule.sessionStatus || ''] ?? 'Đã lên lịch';
    const finished = isLotteryFinishedPhase(item.schedule);
    const liveOrLobby = isLotteryLivePhase(item.schedule);
    const isLive = phase === 'Live';
    const own = findOwnResult(item);
    const ownCode = own?.result || own?.lotteryResult || null;
    const won = ownCode === 'WON' || ownCode === 'PRIORITY_WON';

    return (
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.projectName} numberOfLines={2}>
            {item.application.projectName}
          </Text>
          <View style={[styles.badge, isLive && styles.badgeLive, finished && styles.badgeDone]}>
            <Text style={styles.badgeText}>{phaseLabel}</Text>
          </View>
        </View>
        <Text style={styles.meta}>
          Hồ sơ #{item.application.applicationId.slice(0, 8).toUpperCase()}
        </Text>
        {!!item.schedule.lotteryDate && (
          <Text style={styles.meta}>
            Lịch:{' '}
            {new Date(item.schedule.lotteryDate).toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}

        {own && ownCode ? (
          <View style={[styles.ownBox, won ? styles.ownWon : styles.ownLost]}>
            <Text style={styles.ownTitle}>
              Kết quả của bạn: {LOTTERY_RESULT_LABEL[ownCode] ?? ownCode}
            </Text>
            {!!own.slotCode && (
              <Text style={styles.ownMeta}>Mã suất: {own.slotCode}</Text>
            )}
          </View>
        ) : null}

        <View style={styles.actions}>
          {liveOrLobby && !finished ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => enterLobby(item)} activeOpacity={0.85}>
              <Feather name="radio" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>{isLive ? 'Vào sảnh / Bốc' : 'Vào sảnh'}</Text>
            </TouchableOpacity>
          ) : null}
          {isLive ? (
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => openLive(item)} activeOpacity={0.85}>
              <Text style={styles.secondaryBtnText}>Xem phiên trực tiếp</Text>
            </TouchableOpacity>
          ) : null}
          {!finished ? (
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => openSchedule(item)} activeOpacity={0.85}>
              <Text style={styles.secondaryBtnText}>Xem lịch</Text>
            </TouchableOpacity>
          ) : null}
          {finished || ownCode ? (
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => openResult(item)} activeOpacity={0.85}>
              <Text style={styles.secondaryBtnText}>Kết quả</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Bốc thăm của tôi" onBack={() => navigation.goBack()} isWhite />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.application.applicationId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            rows.length > 0 ? (
              <Text style={styles.hint}>
                Chỉ hiện dự án đã được chủ đầu tư lên lịch bốc thăm.
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="calendar" size={40} color={RHSColors.grey400} />
              <Text style={styles.emptyText}>{info || 'Chưa có lịch bốc thăm.'}</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              colors={[RHSColors.blue700]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
  hint: { ...typography.caption, color: RHSColors.textMuted, marginBottom: spacing.md },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: {
    ...typography.body,
    color: RHSColors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: RHSColors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
    gap: 8,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  projectName: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text, flex: 1 },
  badge: {
    backgroundColor: RHSColors.blue50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  badgeLive: { backgroundColor: '#FFEBEE' },
  badgeDone: { backgroundColor: RHSColors.green50 },
  badgeText: { fontSize: 11, fontWeight: '700', color: RHSColors.blue700 },
  meta: { ...typography.caption, color: RHSColors.textMuted },
  ownBox: { borderRadius: borderRadius.md, padding: spacing.sm, marginTop: 4 },
  ownWon: { backgroundColor: RHSColors.green50 },
  ownLost: { backgroundColor: RHSColors.red50 },
  ownTitle: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text },
  ownMeta: { ...typography.caption, color: RHSColors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: RHSColors.blue700,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
  },
  primaryBtnText: { ...typography.caption, fontWeight: '700', color: '#fff' },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
    backgroundColor: RHSColors.white,
  },
  secondaryBtnText: { ...typography.caption, fontWeight: '600', color: RHSColors.blue700 },
});
