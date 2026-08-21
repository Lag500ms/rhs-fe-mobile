import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl
} from 'react-native';
import { appAlert } from '../../../lib/appDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import {
  Badge,
  Card,
  EmptyState,
  GradientButton,
  SkeletonCardList,
  StatTile,
} from '../../../components/ui';
import type { BadgeTone } from '../../../components/ui';
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
import { JoinCodeReveal } from '../components/JoinCodeReveal';

type Row = {
  application: ApplicationSummary;
  schedule: LotteryScheduleDetail;
  result: LotteryDrawResult | null;
};

const ELIGIBLE = new Set([
  'APPROVED',
  'APPROVED_BY_TIMEOUT',
  'PROPOSED',
  'LOTTERY_WON',
  'DEPOSIT_PENDING',
  'CONTRACT_PENDING',
  'LOTTERY_LOST',
]);

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

const formatSchedule = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

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
      appAlert('Lỗi', err?.response?.data?.message || err?.message || 'Không tải được danh sách.');
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

  const summary = useMemo(() => {
    let live = 0;
    let won = 0;
    for (const row of rows) {
      if (normalizeLotterySession(row.schedule.sessionStatus) === 'Live' || normalizeLotterySession(row.schedule.sessionStatus) === 'Paused') live += 1;
      const code = findOwnResult(row);
      const value = code?.result || code?.lotteryResult;
      const status = String(row.application.applicationStatus || '').toUpperCase();
      if (value === 'WON' || value === 'PRIORITY_WON' || status === 'CONTRACT_PENDING' || status === 'LOTTERY_WON' || status === 'DEPOSIT_PENDING') won += 1;
    }
    return { total: rows.length, live, won };
  }, [rows]);

  const navigateWith = (screen: string, row: Row) =>
    navigation.navigate(screen, {
      projectId: row.application.projectId,
      projectName: row.application.projectName,
      applicationId: row.application.applicationId,
    });

  const renderItem = ({ item }: { item: Row }) => {
    const phase = normalizeLotterySession(item.schedule.sessionStatus);
    const phaseLabel =
      LOTTERY_SESSION_LABEL[phase] ??
      LOTTERY_SESSION_LABEL[item.schedule.sessionStatus || ''] ??
      'Đã lên lịch';
    const finished = isLotteryFinishedPhase(item.schedule);
    const liveOrLobby = isLotteryLivePhase(item.schedule);
    const isLive = phase === 'Live' || phase === 'Paused';
    const own = findOwnResult(item);
    const ownCode = own?.result || own?.lotteryResult || null;
    const appStatus = String(item.application.applicationStatus || '').toUpperCase();
    const won =
      ownCode === 'WON' ||
      ownCode === 'PRIORITY_WON' ||
      appStatus === 'CONTRACT_PENDING' ||
      appStatus === 'LOTTERY_WON' ||
      appStatus === 'DEPOSIT_PENDING';
    const lost = ownCode === 'LOST' || appStatus === 'LOTTERY_LOST';
    const resultLabel = won
      ? LOTTERY_RESULT_LABEL[ownCode === 'PRIORITY_WON' ? 'PRIORITY_WON' : 'WON']
      : lost
        ? LOTTERY_RESULT_LABEL.LOST
        : ownCode
          ? LOTTERY_RESULT_LABEL[ownCode] ?? ownCode
          : null;
    const scheduledAt = formatSchedule(item.schedule.lotteryDate);

    const tone: BadgeTone = isLive ? 'danger' : finished ? 'success' : 'info';
    const accent = isLive
      ? RHSColors.red600
      : finished
        ? RHSColors.green600
        : RHSColors.blue600;

    return (
      <Card style={styles.card} accentColor={accent}>
        <View style={styles.cardHead}>
          <Text style={styles.projectName} numberOfLines={2}>
            {item.application.projectName}
          </Text>
          <Badge label={phaseLabel} tone={tone} dot={isLive} />
        </View>

        <View style={styles.metaRow}>
          <Feather name="hash" size={13} color={RHSColors.textMuted} />
          <Text style={styles.meta}>
            {item.application.applicationId.slice(0, 8).toUpperCase()}
          </Text>
          {!!scheduledAt && (
            <>
              <View style={styles.metaDot} />
              <Feather name="calendar" size={13} color={RHSColors.textMuted} />
              <Text style={styles.meta}>{scheduledAt}</Text>
            </>
          )}
        </View>

        {!!resultLabel && (
          <View style={[styles.ownBox, won ? styles.ownWon : styles.ownLost]}>
            <View
              style={[
                styles.ownIcon,
                { backgroundColor: won ? RHSColors.green600 : RHSColors.grey400 },
              ]}
            >
              <Feather name={won ? 'award' : 'minus'} size={14} color={RHSColors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ownLabel}>Kết quả của bạn</Text>
              <Text
                style={[
                  styles.ownValue,
                  { color: won ? RHSColors.green700 : RHSColors.textSecondary },
                ]}
              >
                {resultLabel}
                {won ? ' · Chờ chủ dự án chọn căn' : ''}
              </Text>
            </View>
          </View>
        )}

        {!!item.schedule.joinCode && !finished && (
          <JoinCodeReveal code={item.schedule.joinCode} compact />
        )}

        <View style={styles.actions}>
          {liveOrLobby && !finished && (
            <GradientButton
              label={isLive ? 'Vào sảnh quay số' : 'Vào sảnh'}
              icon="radio"
              variant={isLive ? 'danger' : 'primary'}
              size="sm"
              pill
              onPress={() => navigateWith('LotteryLobby', item)}
            />
          )}
          {isLive && (
            <GradientButton
              label="Xem sảnh quay số"
              variant="outline"
              size="sm"
              pill
              onPress={() => navigateWith('LotteryLive', item)}
            />
          )}
          {!finished && (
            <GradientButton
              label="Xem lịch"
              variant="ghost"
              size="sm"
              pill
              onPress={() => navigateWith('LotterySchedule', item)}
            />
          )}
          {(finished || ownCode) && (
            <GradientButton
              label="Kết quả"
              icon="award"
              variant={won ? 'success' : 'ghost'}
              size="sm"
              pill
              onPress={() => navigateWith('LotteryResult', item)}
            />
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Bốc thăm của tôi"
        hero
        subtitle="Chỉ hiện dự án đã được chủ đầu tư lên lịch"
        onBack={() => navigation.goBack()}
      >
        <View style={styles.statRow}>
          <StatTile onDark icon="calendar" value={loading ? '—' : summary.total} label="Phiên bốc thăm" />
          <StatTile onDark icon="radio" value={loading ? '—' : summary.live} label="Đang diễn ra" />
          <StatTile onDark icon="award" value={loading ? '—' : summary.won} label="Đã trúng" />
        </View>
      </ScreenHeader>

      {loading ? (
        <View style={styles.list}>
          <SkeletonCardList count={3} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.application.applicationId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="calendar"
              title="Chưa có lịch bốc thăm"
              description={info || 'Khi chủ đầu tư lên lịch, phiên bốc thăm sẽ hiện tại đây.'}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              colors={[RHSColors.blue700]}
              tintColor={RHSColors.blue700}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
  card: { marginBottom: spacing.md, gap: spacing.md },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  projectName: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  meta: { ...typography.caption, color: RHSColors.textMuted },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: RHSColors.textMuted,
    marginHorizontal: spacing.xs,
  },
  ownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  ownWon: { backgroundColor: RHSColors.green50 },
  ownLost: { backgroundColor: RHSColors.grey100 },
  ownIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownLabel: { ...typography.caption, fontSize: 10, color: RHSColors.textMuted, fontWeight: '600' },
  ownValue: { ...typography.bodySmall, fontWeight: '800', marginTop: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
