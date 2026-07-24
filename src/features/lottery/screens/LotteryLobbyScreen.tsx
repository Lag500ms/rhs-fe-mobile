import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { RHSColors, spacing, borderRadius, typography } from '../../../lib/theme';
import { lotteryApi } from '../api/lotteryApi';
import { connectLotteryLobby, leaveLotteryLobby } from '../api/lotteryHub';
import {
  LOTTERY_RESULT_LABEL,
  type LiveDrawResult,
  type LotteryScheduleDetail,
} from '../types/lottery';

type RouteParams = {
  projectId: string;
  projectName?: string;
  applicationId?: string;
};

function useCountdown(targetIso?: string | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return useMemo(() => {
    if (!targetIso) return { ready: true, label: 'Có thể tham gia' };
    const target = new Date(targetIso).getTime();
    if (Number.isNaN(target)) return { ready: true, label: '—' };
    const diff = target - now;
    if (diff <= 0) return { ready: true, label: 'Đã đến giờ bốc thăm' };
    const s = Math.floor(diff / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return {
      ready: false,
      label: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec
        .toString()
        .padStart(2, '0')}`,
    };
  }, [targetIso, now]);
}

export const LotteryLobbyScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { projectId, projectName, applicationId } = (route.params ?? {}) as RouteParams;

  const [schedule, setSchedule] = useState<LotteryScheduleDetail | null>(null);
  const [lobbyCount, setLobbyCount] = useState(0);
  const [hubStatus, setHubStatus] = useState('Đang kết nối...');
  const [drawing, setDrawing] = useState(false);
  const [myResult, setMyResult] = useState<LiveDrawResult | null>(null);
  const [feed, setFeed] = useState<LiveDrawResult[]>([]);
  const hubRef = useRef<any>(null);

  const countdown = useCountdown(schedule?.lotteryDate);

  const loadSchedule = useCallback(async () => {
    try {
      const data = await lotteryApi.getSchedule(projectId);
      setSchedule(data);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không tải được lịch.');
    }
  }, [projectId]);

  useEffect(() => {
    void loadSchedule();
    let alive = true;
    void (async () => {
      const conn = await connectLotteryLobby(projectId, {
        onLobbyCount: (c) => {
          if (alive) setLobbyCount(c);
        },
        onDrawResult: (r) => {
          if (!alive) return;
          setFeed((prev) => [r, ...prev].slice(0, 30));
          if (applicationId && r.applicationId === applicationId) {
            setMyResult(r);
          }
        },
        onError: (msg) => {
          if (alive) setHubStatus(msg.includes('signalr') ? 'Chế độ REST' : msg);
        },
      });
      if (!alive) {
        await leaveLotteryLobby(conn, projectId);
        return;
      }
      hubRef.current = conn;
      setHubStatus(conn ? 'Đã vào sảnh (trực tuyến)' : 'Chế độ REST (không SignalR)');
    })();

    return () => {
      alive = false;
      void leaveLotteryLobby(hubRef.current, projectId);
      hubRef.current = null;
    };
  }, [projectId, applicationId, loadSchedule]);

  const handleDraw = async () => {
    if (!countdown.ready) {
      Alert.alert('Chưa đến giờ', 'Vui lòng chờ đến thời gian bốc thăm.');
      return;
    }
    if (myResult) {
      Alert.alert('Đã bốc', `Kết quả của bạn: ${LOTTERY_RESULT_LABEL[myResult.result] ?? myResult.result}`);
      return;
    }
    setDrawing(true);
    try {
      let result: LiveDrawResult | null = null;
      if (hubRef.current?.state === 'Connected') {
        try {
          // Hub bắn ReceiveDrawResult cho cả sảnh (kể cả chính mình)
          await hubRef.current.invoke('DrawUnit', projectId);
          // Đợi event một nhịp; nếu chưa nhận thì fallback REST không gọi lại (tránh double-draw)
          await new Promise((r) => setTimeout(r, 1200));
        } catch (hubErr: any) {
          // Hub lỗi → dùng REST
          result = await lotteryApi.drawUnit(projectId);
        }
      } else {
        result = await lotteryApi.drawUnit(projectId);
      }
      if (result) {
        setMyResult(result);
        setFeed((prev) => [result!, ...prev].slice(0, 30));
        Alert.alert(
          'Kết quả',
          `${LOTTERY_RESULT_LABEL[result.result] ?? result.result}${
            result.slotCode ? `\nMã suất: ${result.slotCode}` : ''
          }`,
        );
      }
    } catch (err: any) {
      Alert.alert('Không bốc được', err?.response?.data?.message || err?.message || 'Thử lại sau.');
    } finally {
      setDrawing(false);
    }
  };

  const won = myResult && (myResult.result === 'WON' || myResult.result === 'PRIORITY_WON');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Sảnh bốc thăm" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{schedule?.projectName || projectName || 'Phiên bốc thăm'}</Text>
        <Text style={styles.hub}>{hubStatus}</Text>

        <View style={styles.stats}>
          <Stat label="Trong sảnh" value={String(lobbyCount || '—')} />
          <Stat label="Căn còn" value={String(schedule?.availableUnits ?? '—')} />
          <Stat label="Đếm ngược" value={countdown.label} />
        </View>

        <TouchableOpacity
          style={[styles.drawBtn, (!countdown.ready || drawing || !!myResult) && styles.drawBtnDisabled]}
          disabled={!countdown.ready || drawing || !!myResult}
          onPress={() => void handleDraw()}
          activeOpacity={0.9}
        >
          {drawing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="shuffle" size={22} color="#fff" />
              <Text style={styles.drawText}>
                {myResult ? 'Đã bốc thăm' : countdown.ready ? 'Bốc thăm ngay' : 'Chờ đến giờ'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {myResult && (
          <View style={[styles.resultCard, won ? styles.won : styles.lost]}>
            <Text style={styles.resultTitle}>
              {LOTTERY_RESULT_LABEL[myResult.result] ?? myResult.result}
            </Text>
            {!!myResult.slotCode && (
              <Text style={styles.resultMeta}>Mã suất: {myResult.slotCode}</Text>
            )}
            <Text style={styles.resultMeta}>Còn {myResult.remainingUnits} căn</Text>
            {won && applicationId ? (
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={() =>
                  navigation.navigate('ApplicationDetail', { applicationId })
                }
              >
                <Text style={styles.nextText}>Tiếp tục ký hợp đồng / thanh toán</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        <Text style={styles.feedTitle}>Kết quả trực tiếp</Text>
        {feed.length === 0 ? (
          <Text style={styles.muted}>Chưa có lượt bốc nào trong phiên này.</Text>
        ) : (
          feed.map((item, idx) => (
            <View key={`${item.applicationId}-${idx}`} style={styles.feedItem}>
              <Text style={styles.feedName}>{item.applicantName}</Text>
              <Text style={styles.feedResult}>
                {LOTTERY_RESULT_LABEL[item.result] ?? item.result}
                {item.slotCode ? ` · ${item.slotCode}` : ''}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  content: { padding: spacing.lg, paddingBottom: 40 },
  title: { ...typography.h2, color: RHSColors.text },
  hub: { ...typography.caption, color: RHSColors.textMuted, marginTop: 4, marginBottom: 16 },
  stats: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  stat: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  statValue: { fontWeight: '800', fontSize: 16, color: RHSColors.blue700 },
  statLabel: { ...typography.caption, color: RHSColors.textMuted, marginTop: 4 },
  drawBtn: {
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.xl,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  drawBtnDisabled: { opacity: 0.55 },
  drawText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  resultCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: 16,
  },
  won: { backgroundColor: RHSColors.green50 },
  lost: { backgroundColor: RHSColors.red50 },
  resultTitle: { fontWeight: '800', fontSize: 18, color: RHSColors.text },
  resultMeta: { ...typography.body, color: RHSColors.textMuted, marginTop: 4 },
  nextBtn: {
    marginTop: 12,
    backgroundColor: RHSColors.green700,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  nextText: { color: '#fff', fontWeight: '700' },
  feedTitle: { ...typography.h3, marginBottom: 8, color: RHSColors.text },
  muted: { ...typography.body, color: RHSColors.textMuted },
  feedItem: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  feedName: { fontWeight: '700', color: RHSColors.text },
  feedResult: { ...typography.caption, color: RHSColors.textMuted, marginTop: 2 },
});
