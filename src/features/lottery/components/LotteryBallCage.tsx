import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, Line, Rect } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { RHSColors, borderRadius, spacing, typography } from '../../../lib/theme';
import { formatPriorityGroup } from '../../../lib/priorityGroup';
import {
  isWonLotteryResult,
  type LiveDrawResult,
  type LotteryParticipant,
} from '../types/lottery';

const PALETTES = [
  { solid: '#d50000', border: '#ff5252' },
  { solid: '#ffab00', border: '#ffd740' },
  { solid: '#00c853', border: '#69f0ae' },
  { solid: '#0091ea', border: '#40c4ff' },
  { solid: '#aa00ff', border: '#e040fb' },
  { solid: '#ff6d00', border: '#ffab40' },
  { solid: '#00bfa5', border: '#64ffda' },
  { solid: '#c51162', border: '#ff4081' },
];

const CAGE_R = 78;
const BALL = 32;
const LIMIT = CAGE_R - BALL / 2 - 4;
const MAX_BALLS = 16;

type BallState = { x: number; y: number; vx: number; vy: number; rot: number };

type Candidate = {
  id: string;
  code: string;
  name: string;
  priority: string;
};

type Props = {
  spinning: boolean;
  sessionStatus?: string;
  eligible?: LotteryParticipant[];
  winners?: LiveDrawResult[];
  latestWinner?: LiveDrawResult | null;
};

function toCandidates(
  eligible: LotteryParticipant[],
  winners: LiveDrawResult[],
  latest: LiveDrawResult | null,
): Candidate[] {
  if (eligible.length > 0) {
    return eligible.map((e, idx) => {
      const id = e.applicationId || e.applicantId || `c-${idx}`;
      return {
        id,
        code:
          e.applicationCode?.trim() ||
          (id.length > 8 ? id.slice(0, 8).toUpperCase() : `HS-${String(idx + 1).padStart(2, '0')}`),
        name: e.applicantName || 'Hồ sơ',
        priority: formatPriorityGroup(e.priorityGroup),
      };
    });
  }
  if (winners.length > 0) {
    return winners.map((w) => ({
      id: w.applicationId,
      code: w.applicationCode || w.applicationId.slice(0, 8).toUpperCase(),
      name: w.applicantName,
      priority: formatPriorityGroup(w.priorityGroup),
    }));
  }
  if (latest) {
    return [
      {
        id: latest.applicationId,
        code: latest.applicationCode || latest.applicationId.slice(0, 8).toUpperCase(),
        name: latest.applicantName,
        priority: formatPriorityGroup(latest.priorityGroup),
      },
    ];
  }
  return [];
}

function restPositions(n: number): { x: number; y: number }[] {
  const pos: { x: number; y: number }[] = [];
  if (n <= 0) return pos;
  if (n === 1) return [{ x: 0, y: LIMIT - 4 }];
  if (n === 2) return [{ x: -18, y: LIMIT - 6 }, { x: 18, y: LIMIT - 6 }];
  if (n === 3) {
    return [
      { x: -28, y: LIMIT - 10 },
      { x: 0, y: LIMIT - 4 },
      { x: 28, y: LIMIT - 10 },
    ];
  }
  for (let i = 0; i < n; i++) {
    const angle = Math.PI * 0.15 + (i / Math.max(1, n - 1)) * Math.PI * 0.7;
    pos.push({
      x: Math.cos(angle) * (LIMIT - 8) * (i % 2 === 0 ? 0.85 : 1),
      y: Math.sin(angle) * (LIMIT - 6),
    });
  }
  return pos;
}

export const LotteryBallCage: React.FC<Props> = ({
  spinning,
  sessionStatus = '',
  eligible = [],
  winners = [],
  latestWinner,
}) => {
  const candidates = useMemo(
    () => toCandidates(eligible, winners, latestWinner ?? null).slice(0, MAX_BALLS),
    [eligible, winners, latestWinner],
  );
  const rest = useMemo(() => restPositions(candidates.length), [candidates.length]);
  const [balls, setBalls] = useState<BallState[]>([]);
  const ballsRef = useRef<BallState[]>([]);
  const [cageRot, setCageRot] = useState(0);
  const phase = String(sessionStatus || '').toUpperCase();
  const isLive = phase === 'LIVE' || phase === 'RUNNING';
  const isFinished = phase === 'FINISHED' || phase === 'PUBLISHED';

  useEffect(() => {
    const initial = rest.map((p) => ({ x: p.x, y: p.y, vx: 0, vy: 0, rot: 0 }));
    ballsRef.current = initial;
    setBalls(initial);
  }, [rest]);

  useEffect(() => {
    let id = 0;
    let rot = 0;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      if (spinning) {
        rot = (rot + 12) % 360;
        setCageRot(rot);
        const next = ballsRef.current.map((b) => {
          let { x, y, vx, vy, rot: r } = b;
          vx += (Math.random() - 0.5) * 16 - vy * 0.08;
          vy += (Math.random() - 0.5) * 16 + vx * 0.08 - 1.4;
          x += vx;
          y += vy;
          r += vx * 2 + 5;
          const dist = Math.sqrt(x * x + y * y);
          if (dist > LIMIT) {
            const nx = x / dist;
            const ny = y / dist;
            x = nx * LIMIT;
            y = ny * LIMIT;
            const dot = vx * nx + vy * ny;
            vx = (vx - 2 * dot * nx) * 0.9 + (Math.random() - 0.5) * 5;
            vy = (vy - 2 * dot * ny) * 0.9 + (Math.random() - 0.5) * 5;
          }
          const speed = Math.sqrt(vx * vx + vy * vy);
          if (speed > 26) {
            vx = (vx / speed) * 26;
            vy = (vy / speed) * 26;
          }
          return { x, y, vx, vy, rot: r };
        });
        ballsRef.current = next;
        setBalls(next);
        id = requestAnimationFrame(tick);
        return;
      }
      if (rot !== 0) {
        rot = 0;
        setCageRot(0);
      }
      let moving = false;
      const settled = ballsRef.current.map((b, idx) => {
        const t = rest[idx] || { x: 0, y: LIMIT - 4 };
        const dx = t.x - b.x;
        const dy = t.y - b.y;
        if (Math.abs(dx) > 0.6 || Math.abs(dy) > 0.6) {
          moving = true;
          return { x: b.x + dx * 0.28, y: b.y + dy * 0.28, vx: 0, vy: 0, rot: 0 };
        }
        return { x: t.x, y: t.y, vx: 0, vy: 0, rot: 0 };
      });
      if (moving) {
        ballsRef.current = settled;
        setBalls(settled);
        id = requestAnimationFrame(tick);
      }
    };
    id = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(id);
    };
  }, [spinning, rest]);

  const drawnIds = useMemo(() => {
    const ids = new Set(winners.filter((w) => isWonLotteryResult(w.result)).map((w) => w.applicationId));
    if (latestWinner && isWonLotteryResult(latestWinner.result)) ids.add(latestWinner.applicationId);
    return ids;
  }, [winners, latestWinner]);

  const statusText = spinning
    ? 'Lồng cầu đang đảo bóng...'
    : isLive
      ? 'Khán phòng trực tuyến · Giám sát phiên bốc thăm'
      : isFinished
        ? 'Phiên bốc thăm đã hoàn tất'
        : 'Chờ chủ đầu tư mở phiên';

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headIcon}>
          <Feather name="award" size={16} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headTitle}>Lồng cầu bốc thăm</Text>
          <Text style={styles.headSub}>Quay số ngẫu nhiên, công khai theo từng lượt</Text>
        </View>
        <View style={[styles.pill, spinning ? styles.pillSpin : isLive ? styles.pillLive : styles.pillIdle]}>
          <View style={[styles.dot, spinning ? styles.dotSpin : isLive ? styles.dotLive : styles.dotIdle]} />
          <Text style={[styles.pillText, spinning ? styles.pillSpinText : isLive ? styles.pillLiveText : styles.pillIdleText]}>
            {spinning ? 'Đang đảo bóng' : isLive ? 'Sẵn sàng' : 'Chưa mở'}
          </Text>
        </View>
      </View>

      <LinearGradient colors={['#047857', '#065f46', '#042f2e']} style={styles.stage}>
        <View style={styles.cageBox}>
          <View style={[styles.cageSpin, { transform: [{ rotate: `${cageRot}deg` }] }]}>
            <Svg width={CAGE_R * 2 + 8} height={CAGE_R * 2 + 8} viewBox="0 0 200 200">
              <Circle cx="100" cy="100" r="92" fill="none" stroke="#f59e0b" strokeWidth="3.2" />
              <Circle cx="100" cy="100" r="92" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="6 5" opacity={0.75} />
              <Ellipse cx="100" cy="100" rx="46" ry="92" fill="none" stroke="#fbbf24" strokeWidth="2" opacity={0.85} />
              <Ellipse cx="100" cy="100" rx="92" ry="46" fill="none" stroke="#fbbf24" strokeWidth="2" opacity={0.85} />
              <Line x1="100" y1="8" x2="100" y2="192" stroke="#f59e0b" strokeWidth="2.2" />
              <Line x1="8" y1="100" x2="192" y2="100" stroke="#f59e0b" strokeWidth="2.2" />
              <Rect x="98" y="32" width="4.5" height="32" rx="2" fill="#f59e0b" opacity={0.85} />
              <Rect x="98" y="136" width="4.5" height="32" rx="2" fill="#f59e0b" opacity={0.85} />
            </Svg>
          </View>

          {candidates.map((c, idx) => {
            const pal = PALETTES[idx % PALETTES.length];
            const pos = balls[idx] || rest[idx] || { x: 0, y: 0, rot: 0 };
            return (
              <View
                key={c.id || String(idx)}
                style={[
                  styles.ball,
                  {
                    backgroundColor: pal.solid,
                    borderColor: pal.border,
                    transform: [
                      { translateX: pos.x },
                      { translateY: pos.y },
                      { rotate: `${pos.rot || 0}deg` },
                    ],
                  },
                ]}
              >
                <View style={styles.ballCore}>
                  <Text style={styles.ballNum}>{String(idx + 1).padStart(2, '0')}</Text>
                </View>
              </View>
            );
          })}

          <View pointerEvents="none" style={styles.glass} />
        </View>

        <View style={styles.watch}>
          <Feather name={spinning ? 'refresh-cw' : 'eye'} size={14} color="#fde047" />
          <Text style={styles.watchText}>
            {spinning ? 'Chủ đầu tư đang thực hiện quay số...' : statusText}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.listHead}>
        <Feather name="users" size={14} color="#d97706" />
        <Text style={styles.listTitle}>Đối chiếu bóng ({candidates.length} hồ sơ)</Text>
      </View>
      {candidates.length === 0 ? (
        <Text style={styles.empty}>Chưa có hồ sơ trong lồng.</Text>
      ) : (
        candidates.map((c, idx) => {
          const pal = PALETTES[idx % PALETTES.length];
          const drawn = drawnIds.has(c.id);
          return (
            <View key={c.id} style={[styles.row, drawn && styles.rowDrawn]}>
              <View style={[styles.rowBall, { backgroundColor: pal.solid }]}>
                <Text style={styles.rowBallText}>{String(idx + 1).padStart(2, '0')}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {c.code}
                  {c.priority ? ` · ${c.priority}` : ''}
                </Text>
              </View>
              <Text style={[styles.rowState, drawn && styles.rowStateWon]}>
                {drawn ? 'Đã trúng' : 'Trong lồng'}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  headIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headTitle: { ...typography.bodySmall, fontWeight: '800', color: RHSColors.text, textTransform: 'uppercase' },
  headSub: { ...typography.caption, color: RHSColors.textMuted },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  pillSpin: { backgroundColor: '#ffe4e6', borderColor: '#fecdd3' },
  pillLive: { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
  pillIdle: { backgroundColor: RHSColors.grey100, borderColor: RHSColors.grey200 },
  pillText: { fontSize: 10, fontWeight: '800' },
  pillSpinText: { color: '#be123c' },
  pillLiveText: { color: '#166534' },
  pillIdleText: { color: RHSColors.grey600 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dotSpin: { backgroundColor: '#e11d48' },
  dotLive: { backgroundColor: '#16a34a' },
  dotIdle: { backgroundColor: RHSColors.grey400 },
  stage: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    minHeight: 280,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.7)',
    overflow: 'hidden',
  },
  cageBox: {
    width: CAGE_R * 2 + 16,
    height: CAGE_R * 2 + 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cageSpin: { position: 'absolute' },
  ball: {
    position: 'absolute',
    width: BALL,
    height: BALL,
    borderRadius: BALL / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 8px rgba(0,0,0,0.28)' },
      default: { elevation: 4 },
    }),
  },
  ballCore: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballNum: { fontSize: 8, fontWeight: '900', color: '#111' },
  glass: {
    position: 'absolute',
    width: CAGE_R * 2,
    height: CAGE_R * 2,
    borderRadius: CAGE_R,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  watch: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(2, 44, 34, 0.55)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  watchText: { color: '#d1fae5', fontSize: 12, fontWeight: '700', flex: 1 },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  listTitle: { ...typography.caption, fontWeight: '800', color: RHSColors.text, textTransform: 'uppercase' },
  empty: { ...typography.caption, color: RHSColors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: RHSColors.border,
  },
  rowDrawn: { backgroundColor: RHSColors.green50, marginHorizontal: -4, paddingHorizontal: 4, borderRadius: 8 },
  rowBall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBallText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  rowName: { ...typography.bodySmall, fontWeight: '800', color: RHSColors.text },
  rowMeta: { ...typography.caption, color: RHSColors.textMuted },
  rowState: { ...typography.caption, fontWeight: '700', color: RHSColors.textMuted },
  rowStateWon: { color: RHSColors.green700 },
});
