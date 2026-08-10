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
import { lotteryApi } from '../api/lotteryApi';
import {
  LOTTERY_RESULT_LABEL,
  LOTTERY_SESSION_LABEL,
  type LotteryDrawResult,
  type LotteryScheduleDetail,
} from '../types/lottery';

type Row = {
  application: ApplicationSummary;
  schedule: LotteryScheduleDetail | null;
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
      const eligible = apps.filter((a) => ELIGIBLE.has(String(a.applicationStatus || '').toUpperCase()));
      if (eligible.length === 0) {
        setRows([]);
        setInfo(
          apps.length === 0
            ? 'Bạn chưa có hồ sơ nào. Hãy tạo và nộp hồ sơ trước khi tham gia bốc thăm.'
            : 'Chưa có hồ sơ đủ điều kiện bốc thăm. Hồ sơ cần được duyệt (APPROVED) trước.',
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
      setRows(enriched);
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
    const phase = item.schedule?.sessionStatus || 'NOT_SCHEDULED';
    const phaseLabel = LOTTERY_SESSION_LABEL[phase] ?? phase;
    const isFinished = phase === 'Finished' || phase === 'Published' || phase === 'FINISHED';
    const isLive = phase === 'Live' || phase === 'RUNNING';
    const own = findOwnResult(item);
    const ownCode = own?.result || own?.lotteryResult || null;
    const won = ownCode === 'WON' || ownCode === 'PRIORITY_WON';

    return (
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.projectName} numberOfLines={2}>
            {item.application.projectName}
          </Text>
          <View style={[styles.badge, isLive && styles.badgeLive, isFinished && styles.badgeDone]}>
            <Text style={styles.badgeText}>{phaseLabel}</Text>
          </View>
        </View>
        <Text style={styles.meta}>
          Hồ sơ #{item.application.applicationId.slice(0, 8).toUpperCase()}
        </Text>
        {!!item.schedule?.lotteryDate && (
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
            {!!(own.slotCode) && (
              <Text style={styles.ownMeta}>Mã suất: {own.slotCode}</Text>
            )}
          </View>
        ) : null}

        <View style={styles.actions}>
          {!isFinished && (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => enterLobby(item)} activeOpacity={0.85}>
              <Feather name="radio" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>{isLive ? 'Vào sảnh / Bốc' : 'Vào sảnh'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => openLive(item)} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>Xem Live</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => openSchedule(item)} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>Lịch</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => openResult(item)} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>Kết quả</Text>
          </TouchableOpacity>
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
            <Text style={styles.hint}>
              Hồ sơ đã duyệt hiển thị tại đây. Vào sảnh bằng OTP để bốc khi CĐT mở Live (cần SXD giám
              sát). Dùng «Xem Live» để theo dõi ticker / tiến độ mà không cần OTP.
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="inbox" size={48} color={RHSColors.textMuted} />
              <Text style={styles.emptyText}>{info || 'Chưa có dữ liệu bốc thăm.'}</Text>
            </View>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.lg, paddingBottom: 40 },
  hint: { ...typography.body, color: RHSColors.textMuted, marginBottom: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
    marginBottom: 12,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  projectName: { flex: 1, fontWeight: '800', fontSize: 16, color: RHSColors.text },
  badge: {
    backgroundColor: RHSColors.blue50,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeLive: { backgroundColor: RHSColors.amber50 },
  badgeDone: { backgroundColor: RHSColors.green50 },
  badgeText: { fontSize: 11, fontWeight: '700', color: RHSColors.blue700 },
  meta: { ...typography.caption, color: RHSColors.textMuted, marginTop: 4 },
  ownBox: { marginTop: 10, borderRadius: borderRadius.md, padding: 10 },
  ownWon: { backgroundColor: RHSColors.green50 },
  ownLost: { backgroundColor: RHSColors.amber50 },
  ownTitle: { fontWeight: '700', color: RHSColors.text },
  ownMeta: { ...typography.caption, marginTop: 2, color: RHSColors.textMuted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: RHSColors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  secondaryBtnText: { color: RHSColors.blue700, fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { ...typography.body, color: RHSColors.textMuted, textAlign: 'center', paddingHorizontal: 24 },
});
