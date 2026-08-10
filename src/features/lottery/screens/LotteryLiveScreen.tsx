import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { RHSColors, borderRadius, spacing, typography } from '../../../lib/theme';
import { connectLotteryLobby, leaveLotteryLobby } from '../api/lotteryHub';
import { lotteryApi } from '../api/lotteryApi';
import {
  LOTTERY_RESULT_LABEL,
  LOTTERY_SESSION_LABEL,
  type LotteryDrawResult,
} from '../types/lottery';

type RouteParams = {
  projectId: string;
  projectName?: string;
  applicationId?: string;
};

/**
 * Màn giám sát Live (parity web #/lottery-live).
 * Không OTP join — chỉ theo dõi ticker / tiến độ (khác LotteryLobby).
 */
export const LotteryLiveScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { projectId, projectName, applicationId } = (route.params ?? {}) as RouteParams;

  const [result, setResult] = useState<LotteryDrawResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hubError, setHubError] = useState('');
  const [hubConnected, setHubConnected] = useState(false);
  const [lobbyCount, setLobbyCount] = useState(0);
  const [sxdCount, setSxdCount] = useState(0);
  const [sessionStatus, setSessionStatus] = useState('');
  const [ticker, setTicker] = useState<string[]>([]);
  const [totalUnits, setTotalUnits] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const connectionRef = useRef<Awaited<ReturnType<typeof connectLotteryLobby>>>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await lotteryApi.getResult(projectId);
      setResult(data);
      if (data?.totalUnits) setTotalUnits(Number(data.totalUnits) || 0);
      setError('');
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        setError(err?.response?.data?.message || err?.message || 'Không tải được kết quả.');
      }
    }
    try {
      const sched = await lotteryApi.getSchedule(projectId);
      if (sched?.sessionStatus) setSessionStatus(String(sched.sessionStatus));
      if (sched?.availableUnits) setTotalUnits(Number(sched.availableUnits) || 0);
      if (typeof sched?.sxdOnlineCount === 'number') setSxdCount(sched.sxdOnlineCount);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    void load();
    const poll = setInterval(() => {
      void load();
    }, 4000);

    void (async () => {
      try {
        const conn = await connectLotteryLobby(
          projectId,
          {
            onLobbyCount: (n) => {
              if (!cancelled) setLobbyCount(n);
            },
            onSxdSupervisorCount: (n) => {
              if (!cancelled) setSxdCount(n);
            },
            onStatus: (s) => {
              if (!cancelled) setSessionStatus(s);
            },
            onDrawResult: (data) => {
              if (cancelled) return;
              const line = `${data.applicantName || '?'}: ${data.result || ''} ${data.slotCode || ''}`.trim();
              setTicker((prev) => [line, ...prev].slice(0, 40));
              void load();
            },
            onError: (msg) => {
              if (!cancelled) {
                setHubConnected(false);
                setHubError(msg);
              }
            },
          },
          null, // giám sát: không OTP
        );
        if (cancelled) {
          await leaveLotteryLobby(conn, projectId);
          return;
        }
        connectionRef.current = conn;
        if (conn) {
          setHubConnected(true);
          setHubError('');
        } else {
          setHubConnected(false);
        }
        await load();
      } catch (err: any) {
        if (!cancelled) {
          setHubConnected(false);
          setHubError(err?.message || 'Không nối được sảnh realtime');
        }
      }
    })();

    return () => {
      cancelled = true;
      clearInterval(poll);
      void leaveLotteryLobby(connectionRef.current, projectId);
      connectionRef.current = null;
      setHubConnected(false);
    };
  }, [projectId, load]);

  const winners = result?.winners ?? [];
  const losers = result?.losers ?? [];
  const drawn =
    winners.length || ticker.filter((t) => /WIN|Trúng|WON|PRIORITY/i.test(t)).length;
  const units = totalUnits || Number(result?.totalUnits) || 0;
  const pct = units > 0 ? Math.min(100, Math.round((drawn / units) * 100)) : 0;
  const phaseLabel = LOTTERY_SESSION_LABEL[sessionStatus] ?? (sessionStatus || '...');

  if (!projectId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Giám sát Live" onBack={() => navigation.goBack()} isWhite />
        <View style={styles.center}>
          <Text style={styles.error}>Chưa chọn dự án. Vào Bốc thăm của tôi rồi mở Live.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Giám sát Live"
        onBack={() => navigation.goBack()}
        isWhite
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            colors={[RHSColors.blue700]}
            tintColor={RHSColors.blue700}
          />
        }
      >
        <Text style={styles.title}>{projectName || result?.projectName || 'Dự án'}</Text>

        {!!hubError && (
          <View style={[styles.alert, styles.alertError]}>
            <Text style={styles.alertText}>Không nối sảnh realtime: {hubError}</Text>
          </View>
        )}
        {!hubError && (
          <View style={[styles.alert, hubConnected ? styles.alertOk : styles.alertInfo]}>
            <Text style={styles.alertText}>
              {hubConnected
                ? `Đã nối sảnh · SXD giám sát: ${sxdCount}`
                : 'Đang nối sảnh realtime… (hoặc chế độ REST)'}
            </Text>
          </View>
        )}

        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Phiên: {phaseLabel}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Online: {lobbyCount}</Text>
          </View>
          <View style={[styles.badge, sxdCount > 0 ? styles.badgeOk : styles.badgeWarn]}>
            <Text style={styles.badgeText}>SXD: {sxdCount}</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHead}>
            <Text style={styles.progressTitle}>Tiến độ bốc thăm</Text>
            <Text style={styles.progressMeta}>
              {drawn}/{units || '—'} căn ({pct}%)
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        </View>

        {ticker.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Live log</Text>
            {ticker.map((t, i) => (
              <View key={`${t}-${i}`} style={styles.tickerItem}>
                <Text style={styles.tickerText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {loading && <ActivityIndicator color={RHSColors.blue700} style={{ marginTop: 16 }} />}
        {!!error && <Text style={styles.error}>{error}</Text>}

        {!loading && !result && !error && (
          <Text style={styles.meta}>
            Chưa có kết quả lưu. Theo dõi ticker khi CĐT đang bốc; kết thúc phiên sẽ có biên bản.
          </Text>
        )}

        {winners.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danh sách trúng ({winners.length})</Text>
            {winners.map((w, i) => {
              const isMine =
                !!applicationId && String(w.applicationId ?? '') === applicationId;
              return (
                <View key={w.applicationId || i} style={[styles.winnerItem, isMine && styles.mine]}>
                  <Text style={styles.name}>
                    {w.applicantName || w.fullName || 'Ứng viên'}
                    {isMine ? ' (Bạn)' : ''}
                  </Text>
                  <Text style={styles.sub}>
                    Trúng #{i + 1}
                    {w.slotCode ? ` · ${w.slotCode}` : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {losers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danh sách chờ bổ sung ({losers.length})</Text>
            {losers.map((w, i) => {
              const code = String(w.result ?? w.lotteryResult ?? '');
              const isMine =
                !!applicationId && String(w.applicationId ?? '') === applicationId;
              return (
                <View key={w.applicationId || i} style={[styles.loserItem, isMine && styles.mine]}>
                  <Text style={styles.name}>
                    {w.applicantName || w.fullName || 'Ứng viên'}
                    {isMine ? ' (Bạn)' : ''}
                  </Text>
                  <Text style={styles.sub}>{LOTTERY_RESULT_LABEL[code] ?? (code || 'Không trúng')}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  center: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  title: { ...typography.h3, color: RHSColors.text, marginBottom: spacing.md },
  alert: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  alertOk: { backgroundColor: RHSColors.green50 },
  alertInfo: { backgroundColor: RHSColors.blue50 },
  alertError: { backgroundColor: RHSColors.red50 },
  alertText: { ...typography.caption, color: RHSColors.text },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  badge: {
    backgroundColor: RHSColors.blue50,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  badgeOk: { backgroundColor: RHSColors.green50 },
  badgeWarn: { backgroundColor: RHSColors.amber50 },
  badgeText: { ...typography.caption, fontWeight: '600', color: RHSColors.text },
  progressCard: {
    backgroundColor: RHSColors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: RHSColors.border,
    marginBottom: spacing.md,
  },
  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressTitle: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text },
  progressMeta: { ...typography.caption, color: RHSColors.textMuted },
  progressTrack: {
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: RHSColors.grey100,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.full,
  },
  section: { marginTop: spacing.md },
  sectionTitle: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text, marginBottom: spacing.sm },
  tickerItem: {
    backgroundColor: RHSColors.green50,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: 4,
  },
  tickerText: { ...typography.caption, color: RHSColors.text },
  winnerItem: {
    backgroundColor: RHSColors.green50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  loserItem: {
    backgroundColor: RHSColors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  mine: { borderColor: RHSColors.blue700, borderWidth: 2 },
  name: { ...typography.bodySmall, fontWeight: '600', color: RHSColors.text },
  sub: { ...typography.caption, color: RHSColors.textMuted, marginTop: 2 },
  meta: { ...typography.caption, color: RHSColors.textMuted, marginTop: spacing.sm },
  error: { ...typography.body, color: RHSColors.red600, marginTop: spacing.sm },
});
