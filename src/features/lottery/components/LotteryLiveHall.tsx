import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Badge, Card, ProgressBar, StatTile } from '../../../components/ui';
import { RHSColors, borderRadius, spacing, typography } from '../../../lib/theme';
import {
  LOTTERY_RESULT_LABEL,
  LOTTERY_SESSION_LABEL,
  isWonLotteryResult,
  type LiveDrawResult,
  type LotteryLiveState,
} from '../types/lottery';

type Props = {
  live: LotteryLiveState | null;
  applicationId?: string;
  logs: string[];
  hubOk: boolean;
  hubLabel: string;
  restMode?: boolean;
};

function formatClock(d: Date) {
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function hsCode(r: { applicationCode?: string; applicationId: string }) {
  return r.applicationCode?.trim() || r.applicationId.slice(0, 8).toUpperCase();
}

function sessionTone(status: string): 'danger' | 'warning' | 'success' | 'info' | 'neutral' {
  const s = status.toUpperCase();
  if (s === 'LIVE' || s === 'RUNNING') return 'danger';
  if (s === 'PAUSED') return 'warning';
  if (s === 'FINISHED' || s === 'PUBLISHED') return 'success';
  return 'info';
}

export const LotteryLiveHall: React.FC<Props> = ({
  live,
  applicationId,
  logs,
  hubOk,
  hubLabel,
  restMode,
}) => {
  const [now, setNow] = useState(() => new Date());
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const spinning = (live?.sessionStatus || '').toUpperCase() === 'LIVE';
  useEffect(() => {
    if (!spinning) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.55, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [spinning, pulse]);

  const total = live?.totalUnits ?? 0;
  const drawn = live?.drawnUnitsCount ?? 0;
  const remaining = live?.remainingUnits ?? Math.max(0, total - drawn);
  const progress = total > 0 ? drawn / total : 0;
  const phase = live?.sessionStatus || '';
  const phaseLabel = LOTTERY_SESSION_LABEL[phase] ?? (phase || 'Chưa có phiên');
  const latest = live?.latestDrawResult ?? null;
  const next = live?.nextCandidate ?? null;
  const winners = live?.recentWinners ?? [];
  const fund = live?.projectApartmentFundStat;
  const categories = live?.apartmentFundStats ?? [];
  const mine = useMemo(() => {
    if (!applicationId) return null;
    return (
      winners.find((w) => w.applicationId === applicationId) ??
      (latest?.applicationId === applicationId ? latest : null)
    );
  }, [applicationId, winners, latest]);
  const iWon = mine && isWonLotteryResult(mine.result);
  const iLost = mine && String(mine.result).toUpperCase() === 'LOST';

  const frameTitle = spinning
    ? next
      ? 'Hồ sơ đang gọi'
      : 'Đang quay số'
    : phase.toUpperCase() === 'PAUSED'
      ? 'Phiên tạm dừng'
      : 'Chờ chủ đầu tư bốc tiếp';
  const frameCode = next ? hsCode(next) : latest ? hsCode(latest) : '— — —';
  const frameName = next?.applicantName || latest?.applicantName || 'Chưa có hồ sơ được gọi';

  return (
    <View style={styles.wrap}>
      <View style={styles.metaRow}>
        <Badge label={formatClock(now)} tone="neutral" icon="clock" />
        <Badge label={phaseLabel} tone={sessionTone(phase)} dot={spinning} />
        <Badge
          label={hubOk ? 'Trực tuyến' : restMode ? 'REST' : hubLabel}
          tone={hubOk ? 'success' : 'warning'}
        />
      </View>
      {!!live?.developerName && (
        <Text style={styles.dev}>{live.developerName}</Text>
      )}

      <Card style={styles.note} accentColor={RHSColors.blue600}>
        <Text style={styles.noteTitle}>Bạn chỉ theo dõi phiên</Text>
        <Text style={styles.noteBody}>
          Chủ đầu tư bốc từng hồ sơ. Phiên chỉ công bố ai trúng suất — căn hộ được gán sau.
        </Text>
      </Card>

      {iWon && (
        <Card style={styles.mineWon} accentColor={RHSColors.green600}>
          <Text style={styles.mineTitle}>Bạn đã trúng suất</Text>
          <Text style={styles.mineBody}>
            Chủ dự án sẽ chọn căn hộ cụ thể. Khi đã có căn, mở hồ sơ để đóng cọc và ký hợp đồng.
          </Text>
        </Card>
      )}
      {iLost && (
        <Card style={styles.mineLost} accentColor={RHSColors.red600}>
          <Text style={styles.mineTitleLost}>Hồ sơ của bạn không trúng lần này</Text>
        </Card>
      )}

      <Text style={styles.zone}>1 · Sảnh quay số</Text>
      <Card elevated>
        <ProgressBar
          value={progress}
          label="Tiến độ suất"
          valueLabel={`${drawn}/${total || '—'} suất`}
          height={10}
        />
        <Animated.View style={[styles.frame, { opacity: spinning ? pulse : 1 }]}>
          <Text style={styles.frameKicker}>{frameTitle}</Text>
          <Text style={styles.frameCode}>{frameCode}</Text>
          <Text style={styles.frameName} numberOfLines={2}>
            {frameName}
          </Text>
          {spinning ? (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>LIVE</Text>
            </View>
          ) : null}
        </Animated.View>
        {latest ? <LatestResultCard result={latest} mine={latest.applicationId === applicationId} /> : (
          <Text style={styles.muted}>Chưa có lượt công bố. Chờ chủ đầu tư bấm bốc tiếp.</Text>
        )}
        <View style={styles.statRow}>
          <StatTile icon="home" value={remaining} label="Suất còn" tint={RHSColors.amber700} />
          <StatTile icon="award" value={live?.priorityWinnersCount ?? 0} label="Ưu tiên" tint={RHSColors.green700} />
          <StatTile icon="shuffle" value={live?.randomWinnersCount ?? 0} label="Ngẫu nhiên" />
        </View>
        <Text style={styles.caption}>
          Trong sảnh {live?.lobbyCount ?? 0} · Sở giám sát {live?.sxdOnlineCount ?? 0} · Chưa bốc{' '}
          {live?.undrawnParticipantsCount ?? 0}
        </Text>
      </Card>

      <Text style={styles.zone}>2 · Danh sách trúng</Text>
      <Card>
        <View style={styles.tableHead}>
          <Text style={[styles.th, styles.colStt]}>STT</Text>
          <Text style={[styles.th, styles.colCode]}>Mã HS</Text>
          <Text style={[styles.th, styles.colName]}>Họ tên</Text>
          <Text style={[styles.th, styles.colUnit]}>Kết quả</Text>
        </View>
        {winners.length === 0 ? (
          <Text style={styles.muted}>Chưa có hồ sơ trúng trong phiên này.</Text>
        ) : (
          winners.map((w, i) => {
            const isMine = !!applicationId && w.applicationId === applicationId;
            return (
              <View key={`${w.applicationId}-${i}`} style={[styles.tr, isMine && styles.trMine]}>
                <Text style={[styles.td, styles.colStt]}>{w.stt || i + 1}</Text>
                <Text style={[styles.td, styles.colCode]} numberOfLines={1}>
                  {hsCode(w)}
                </Text>
                <Text style={[styles.td, styles.colName]} numberOfLines={1}>
                  {w.applicantName}
                  {isMine ? ' (Bạn)' : ''}
                </Text>
                <Text style={[styles.td, styles.colUnit, styles.pending]} numberOfLines={2}>
                  Trúng suất
                </Text>
              </View>
            );
          })
        )}
      </Card>

      <Text style={styles.zone}>3 · Quỹ căn dự án</Text>
      <Card>
        {fund ? (
          <ProgressBar
            value={fund.totalUnits > 0 ? fund.remainingUnits / fund.totalUnits : 0}
            label={fund.categoryName || 'Còn lại toàn dự án'}
            valueLabel={`${fund.remainingUnits}/${fund.totalUnits}`}
            colors={[RHSColors.green600, RHSColors.blue400]}
            height={10}
          />
        ) : (
          <ProgressBar
            value={total > 0 ? remaining / total : 0}
            label="Còn lại"
            valueLabel={`${remaining}/${total || '—'}`}
            colors={[RHSColors.green600, RHSColors.blue400]}
            height={10}
          />
        )}
        {categories.length > 0 && (
          <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
            {categories.map((c) => (
              <ProgressBar
                key={c.categoryName}
                value={c.totalUnits > 0 ? c.remainingUnits / c.totalUnits : 0}
                label={c.categoryName}
                valueLabel={`${c.remainingUnits}/${c.totalUnits}`}
                height={8}
              />
            ))}
          </View>
        )}
      </Card>

      <Text style={styles.zone}>Nhật ký phiên</Text>
      <Card>
        {logs.length === 0 ? (
          <Text style={styles.muted}>Sự kiện realtime sẽ hiện tại đây.</Text>
        ) : (
          logs.map((line, i) => (
            <View key={`${line}-${i}`} style={styles.logRow}>
              <Feather name="activity" size={12} color={RHSColors.green600} />
              <Text style={styles.logText}>{line}</Text>
            </View>
          ))
        )}
      </Card>
    </View>
  );
};

function LatestResultCard({ result, mine }: { result: LiveDrawResult; mine: boolean }) {
  const won = isWonLotteryResult(result.result);
  return (
    <View style={[styles.latest, won ? styles.latestWon : styles.latestLost, mine && styles.trMine]}>
      <Text style={styles.latestKicker}>Kết quả vừa công bố</Text>
      <Text style={styles.latestCode}>{hsCode(result)}</Text>
      <Text style={styles.latestName}>{result.applicantName}</Text>
      <Text style={styles.latestResult}>
        {LOTTERY_RESULT_LABEL[result.result] ?? result.result}
        {isWonLotteryResult(result.result) ? ' · Chờ chủ dự án chọn căn' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dev: { ...typography.caption, color: RHSColors.textMuted, fontWeight: '600' },
  note: { gap: 4 },
  noteTitle: { ...typography.bodySmall, fontWeight: '800', color: RHSColors.blue800 },
  noteBody: { ...typography.caption, color: RHSColors.textSecondary, lineHeight: 18 },
  mineWon: { backgroundColor: RHSColors.green50, gap: 4 },
  mineLost: { backgroundColor: RHSColors.red50 },
  mineTitle: { ...typography.bodySmall, fontWeight: '800', color: RHSColors.green700 },
  mineTitleLost: { ...typography.bodySmall, fontWeight: '800', color: RHSColors.red700 },
  mineBody: { ...typography.caption, color: RHSColors.textSecondary, lineHeight: 18 },
  zone: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: RHSColors.blue800,
    marginTop: spacing.sm,
  },
  frame: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: RHSColors.blue800,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  frameKicker: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  frameCode: {
    marginTop: spacing.sm,
    fontSize: 28,
    fontWeight: '900',
    color: RHSColors.white,
    letterSpacing: 1,
  },
  frameName: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  livePill: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: RHSColors.red600,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: RHSColors.white },
  livePillText: { color: RHSColors.white, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  muted: { ...typography.caption, color: RHSColors.textMuted, marginTop: spacing.sm },
  caption: { ...typography.caption, color: RHSColors.textMuted, marginTop: spacing.md },
  statRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  latest: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  latestWon: { backgroundColor: RHSColors.green50 },
  latestLost: { backgroundColor: RHSColors.amber50 },
  latestKicker: { ...typography.caption, fontWeight: '700', color: RHSColors.textMuted },
  latestCode: { fontSize: 18, fontWeight: '800', color: RHSColors.text, marginTop: 2 },
  latestName: { ...typography.bodySmall, color: RHSColors.textSecondary },
  latestResult: { ...typography.caption, fontWeight: '700', color: RHSColors.blue800, marginTop: 4 },
  tableHead: {
    flexDirection: 'row',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.border,
    marginBottom: spacing.sm,
  },
  th: { ...typography.caption, fontWeight: '800', color: RHSColors.textMuted },
  tr: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: RHSColors.border,
  },
  trMine: { backgroundColor: RHSColors.blue50, marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },
  td: { ...typography.caption, color: RHSColors.text, fontWeight: '600' },
  colStt: { width: 32 },
  colCode: { width: 72 },
  colName: { flex: 1, paddingRight: spacing.xs },
  colUnit: { width: 88, textAlign: 'right' },
  pending: { color: RHSColors.amber700, fontWeight: '700' },
  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  logText: { ...typography.caption, color: RHSColors.text, flex: 1, lineHeight: 18 },
});
