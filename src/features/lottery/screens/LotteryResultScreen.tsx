import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import {
  Badge,
  Card,
  CelebrationModal,
  EmptyState,
  GradientButton,
  SkeletonCardList,
  StatTile,
} from '../../../components/ui';
import { RHSColors, borderRadius, spacing, typography, shadows } from '../../../lib/theme';
import { lotteryApi } from '../api/lotteryApi';
import {
  LOTTERY_RESULT_LABEL,
  type LotteryDrawParticipant,
  type LotteryDrawResult,
} from '../types/lottery';

type RouteParams = {
  projectId: string;
  projectName?: string;
  applicationId?: string;
};

type Filter = 'all' | 'won' | 'lost';

const MEDALS = [
  { ring: '#FFC107', glow: '#FFC107', label: 'Hạng 1', size: 84 },
  { ring: '#B0BEC5', glow: '#90A4AE', label: 'Hạng 2', size: 68 },
  { ring: '#D68910', glow: '#B9770E', label: 'Hạng 3', size: 68 },
];

const resultCode = (p: LotteryDrawParticipant) => String(p.result ?? p.lotteryResult ?? '');
const isWinner = (p: LotteryDrawParticipant) => {
  const code = resultCode(p);
  return code === 'WON' || code === 'PRIORITY_WON';
};
const displayName = (p: LotteryDrawParticipant) =>
  p.fullName || p.applicantName || 'Ứng viên';
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

export const LotteryResultScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { projectId, projectName, applicationId } = (route.params ?? {}) as RouteParams;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LotteryDrawResult | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [celebrated, setCelebrated] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await lotteryApi.getResult(projectId);
      setResult(data);
      if (!data) setError('Chưa có kết quả bốc thăm cho dự án này.');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không tải được kết quả.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const entries: LotteryDrawParticipant[] = useMemo(() => {
    if (!result) return [];
    if (Array.isArray(result.participants) && result.participants.length) {
      return result.participants;
    }
    return [...(result.winners ?? []), ...(result.losers ?? [])];
  }, [result]);

  const winners = useMemo(() => entries.filter(isWinner), [entries]);
  const podium = useMemo(() => winners.slice(0, 3), [winners]);

  const own = useMemo(
    () =>
      applicationId
        ? entries.find((p) => String(p.applicationId ?? '') === applicationId) ?? null
        : null,
    [entries, applicationId],
  );
  const ownWon = !!own && isWinner(own);

  // Mở màn ăn mừng đúng một lần sau khi biết người dùng trúng.
  useEffect(() => {
    if (!loading && ownWon && !celebrated) {
      setCelebrated(true);
      setCelebrating(true);
    }
  }, [loading, ownWon, celebrated]);

  const visibleEntries = useMemo(() => {
    if (filter === 'won') return entries.filter(isWinner);
    if (filter === 'lost') return entries.filter((p) => !isWinner(p));
    return entries;
  }, [entries, filter]);

  const drawnAt = result?.runAt || result?.drawnAt;

  const renderPodiumSlot = (p: LotteryDrawParticipant | undefined, rank: number) => {
    if (!p) return <View style={styles.podiumSlot} />;
    const medal = MEDALS[rank];
    const name = displayName(p);
    const mine = !!applicationId && String(p.applicationId ?? '') === applicationId;

    return (
      <View style={styles.podiumSlot}>
        {rank === 0 && (
          <View style={styles.crown}>
            <Feather name="award" size={18} color="#FFC107" />
          </View>
        )}
        <View
          style={[
            styles.avatar,
            {
              width: medal.size,
              height: medal.size,
              borderRadius: medal.size / 2,
              borderColor: medal.ring,
              shadowColor: medal.glow,
            },
          ]}
        >
          <Text style={[styles.avatarText, rank === 0 && styles.avatarTextLarge]}>
            {initials(name)}
          </Text>
        </View>
        <View style={[styles.rankChip, { backgroundColor: medal.ring }]}>
          <Text style={styles.rankChipText}>{rank + 1}</Text>
        </View>
        <Text style={styles.podiumName} numberOfLines={2}>
          {name}
          {mine ? ' (Bạn)' : ''}
        </Text>
        {!!p.slotCode && <Text style={styles.podiumSlotCode}>{p.slotCode}</Text>}
        {!p.slotCode && <Text style={styles.podiumSlotCode}>Chờ CĐT chọn căn</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Kết quả bốc thăm"
        hero
        subtitle={result?.projectName || projectName || 'Dự án'}
        onBack={() => navigation.goBack()}
      >
        {!loading && entries.length > 0 && (
          <View style={styles.statRow}>
            <StatTile onDark icon="users" value={entries.length} label="Hồ sơ dự thăm" />
            <StatTile onDark icon="award" value={winners.length} label="Trúng tuyển" />
            <StatTile
              onDark
              icon="home"
              value={result?.availableUnitsAfter ?? result?.totalUnits ?? '—'}
              label="Suất còn lại"
            />
          </View>
        )}
      </ScreenHeader>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading && <SkeletonCardList count={4} />}

        {!loading && !!error && (
          <EmptyState
            icon="clock"
            title="Chưa có kết quả"
            description={error}
            actionLabel="Tải lại"
            onAction={() => void load()}
          />
        )}

        {!loading && !error && entries.length === 0 && (
          <EmptyState
            icon="inbox"
            title="Chưa có dữ liệu"
            description="Phiên bốc thăm chưa công bố danh sách kết quả."
          />
        )}

        {!loading && entries.length > 0 && (
          <>
            {!!drawnAt && (
              <Text style={styles.drawnAt}>
                Bốc thăm lúc {new Date(String(drawnAt)).toLocaleString('vi-VN')}
              </Text>
            )}

            {podium.length > 0 && (
              <Card style={styles.podiumCard} elevated bare>
                <LinearGradient
                  colors={[RHSColors.blue50, RHSColors.white]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.podiumInner}
                >
                  <Text style={styles.podiumHeading}>Suất trúng đầu tiên</Text>
                  <View style={styles.podiumRow}>
                    {renderPodiumSlot(podium[1], 1)}
                    {renderPodiumSlot(podium[0], 0)}
                    {renderPodiumSlot(podium[2], 2)}
                  </View>
                </LinearGradient>
              </Card>
            )}

            {!!own && (
              <Card
                style={[styles.ownCard, ownWon ? styles.ownCardWon : styles.ownCardLost]}
                elevated
              >
                <View style={styles.ownHead}>
                  <View
                    style={[
                      styles.ownIcon,
                      { backgroundColor: ownWon ? RHSColors.green50 : RHSColors.grey100 },
                    ]}
                  >
                    <Feather
                      name={ownWon ? 'award' : 'heart'}
                      size={20}
                      color={ownWon ? RHSColors.green700 : RHSColors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ownLabel}>Kết quả của bạn</Text>
                    <Text
                      style={[
                        styles.ownResult,
                        { color: ownWon ? RHSColors.green700 : RHSColors.textSecondary },
                      ]}
                    >
                      {LOTTERY_RESULT_LABEL[resultCode(own)] ?? resultCode(own) ?? '—'}
                    </Text>
                  </View>
                </View>
                {!!own.slotCode && (
                  <View style={styles.slotBox}>
                    <Text style={styles.slotLabel}>MÃ CĂN</Text>
                    <Text style={styles.slotValue}>{own.slotCode}</Text>
                  </View>
                )}
                {ownWon && !own.slotCode && (
                  <View style={styles.slotBox}>
                    <Text style={styles.slotLabel}>MÃ CĂN</Text>
                    <Text style={[styles.slotValue, { fontSize: 16 }]}>Chờ CĐT chọn căn</Text>
                  </View>
                )}
                {!ownWon && (
                  <Text style={styles.ownHint}>
                    Bạn vẫn có thể đăng ký dự án khác. Hồ sơ đã duyệt được dùng lại cho lần bốc
                    thăm sau.
                  </Text>
                )}
              </Card>
            )}

            <View style={styles.filterRow}>
              {([
                { key: 'all', label: `Tất cả (${entries.length})` },
                { key: 'won', label: `Trúng (${winners.length})` },
                { key: 'lost', label: `Không trúng (${entries.length - winners.length})` },
              ] as { key: Filter; label: string }[]).map((chip) => {
                const active = filter === chip.key;
                return (
                  <TouchableOpacity
                    key={chip.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setFilter(chip.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {visibleEntries.map((p, i) => {
              const won = isWinner(p);
              const mine = !!applicationId && String(p.applicationId ?? '') === applicationId;
              const name = displayName(p);
              return (
                <Card
                  key={`${p.applicationId ?? i}`}
                  style={[styles.row, mine && styles.rowMine]}
                  accentColor={won ? RHSColors.green600 : undefined}
                >
                  <View
                    style={[
                      styles.rowAvatar,
                      { backgroundColor: won ? RHSColors.green50 : RHSColors.grey100 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rowAvatarText,
                        { color: won ? RHSColors.green700 : RHSColors.textSecondary },
                      ]}
                    >
                      {initials(name)}
                    </Text>
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {name}
                      {mine ? ' (Bạn)' : ''}
                    </Text>
                    {!!p.slotCode && <Text style={styles.rowSlot}>Căn {p.slotCode}</Text>}
                    {won && !p.slotCode && (
                      <Text style={styles.rowSlot}>Chờ CĐT chọn căn</Text>
                    )}
                  </View>
                  <Badge
                    label={LOTTERY_RESULT_LABEL[resultCode(p)] ?? resultCode(p) ?? '—'}
                    tone={won ? 'success' : 'neutral'}
                  />
                </Card>
              );
            })}
          </>
        )}

        {!!applicationId && (
          <GradientButton
            label="Về hồ sơ của tôi"
            icon="arrow-right"
            iconPosition="right"
            size="lg"
            fullWidth
            style={styles.backApp}
            onPress={() => navigation.navigate('ApplicationDetail', { applicationId })}
          />
        )}
      </ScrollView>

      <CelebrationModal
        visible={celebrating}
        tone="celebrate"
        title="Chúc mừng, bạn đã trúng suất!"
        message={result?.projectName || projectName || 'Dự án nhà ở xã hội'}
        highlightValue={own?.slotCode || 'Chờ CĐT chọn căn'}
        highlightLabel={own?.slotCode ? 'mã căn của bạn' : 'chưa gán căn'}
        primaryLabel="Xem kết quả chi tiết"
        onPrimary={() => setCelebrating(false)}
        secondaryLabel={applicationId ? 'Tới hồ sơ' : undefined}
        onSecondary={() => {
          setCelebrating(false);
          if (applicationId) navigation.navigate('ApplicationDetail', { applicationId });
        }}
        onClose={() => setCelebrating(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  content: { padding: spacing.lg, paddingBottom: spacing.huge },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  drawnAt: {
    ...typography.caption,
    color: RHSColors.textMuted,
    marginBottom: spacing.md,
  },

  podiumCard: { marginBottom: spacing.lg },
  podiumInner: { paddingVertical: spacing.xl, paddingHorizontal: spacing.md },
  podiumHeading: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 1,
    color: RHSColors.blue700,
    textAlign: 'center',
    marginBottom: spacing.lg,
    textTransform: 'uppercase',
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  podiumSlot: { flex: 1, alignItems: 'center' },
  crown: { marginBottom: spacing.xs },
  avatar: {
    borderWidth: 3,
    backgroundColor: RHSColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: RHSColors.blue800 },
  avatarTextLarge: { fontSize: 24 },
  rankChip: {
    marginTop: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: RHSColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankChipText: { fontSize: 12, fontWeight: '900', color: RHSColors.white },
  podiumName: {
    ...typography.caption,
    fontWeight: '700',
    color: RHSColors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  podiumSlotCode: {
    ...typography.caption,
    fontSize: 11,
    color: RHSColors.textMuted,
    marginTop: 2,
  },

  ownCard: { marginBottom: spacing.lg, gap: spacing.md },
  ownCardWon: { borderColor: RHSColors.green600, borderWidth: 1.5 },
  ownCardLost: { borderColor: RHSColors.border },
  ownHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ownIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownLabel: { ...typography.caption, color: RHSColors.textMuted, fontWeight: '600' },
  ownResult: { ...typography.h3, fontWeight: '800', marginTop: 2 },
  slotBox: {
    backgroundColor: RHSColors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  slotLabel: {
    ...typography.caption,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: RHSColors.textMuted,
  },
  slotValue: {
    fontSize: 22,
    fontWeight: '900',
    color: RHSColors.blue800,
    marginTop: 2,
  },
  ownHint: { ...typography.caption, color: RHSColors.textSecondary, lineHeight: 18 },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: RHSColors.white,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  chipActive: {
    backgroundColor: RHSColors.blue700,
    borderColor: RHSColors.blue700,
    ...shadows.sm,
  },
  chipText: { ...typography.caption, fontWeight: '600', color: RHSColors.textSecondary },
  chipTextActive: { color: RHSColors.white },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowMine: { backgroundColor: RHSColors.blue50, borderColor: RHSColors.blue200 },
  rowAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAvatarText: { fontSize: 14, fontWeight: '800' },
  rowBody: { flex: 1 },
  rowName: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text },
  rowSlot: { ...typography.caption, color: RHSColors.textMuted, marginTop: 2 },

  backApp: { marginTop: spacing.xl },
});
