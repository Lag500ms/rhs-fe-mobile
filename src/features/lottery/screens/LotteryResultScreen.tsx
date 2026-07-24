import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { RHSColors, spacing, borderRadius, typography } from '../../../lib/theme';
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

export const LotteryResultScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { projectId, projectName, applicationId } = (route.params ?? {}) as RouteParams;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LotteryDrawResult | null>(null);

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

  const entries: LotteryDrawParticipant[] = (() => {
    if (!result) return [];
    if (Array.isArray(result.participants) && result.participants.length) return result.participants;
    const w = result.winners ?? [];
    const l = result.losers ?? [];
    return [...w, ...l];
  })();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Kết quả bốc thăm" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{result?.projectName || projectName || 'Dự án'}</Text>
        {loading && <ActivityIndicator color={RHSColors.blue700} style={{ marginTop: 24 }} />}
        {!!error && !loading && <Text style={styles.error}>{error}</Text>}
        {!loading && entries.length > 0 && (
          <>
            <Text style={styles.meta}>
              {entries.length} hồ sơ ·{' '}
              {result?.runAt || result?.drawnAt
                ? new Date(String(result.runAt || result.drawnAt)).toLocaleString('vi-VN')
                : '—'}
            </Text>
            {entries.map((p, i) => {
              const code = String(p.result ?? p.lotteryResult ?? '');
              const isMine =
                !!applicationId &&
                String(p.applicationId ?? '') === applicationId;
              return (
                <View
                  key={`${p.applicationId ?? i}`}
                  style={[styles.item, isMine && styles.mine]}
                >
                  <Text style={styles.name}>
                    {p.fullName || p.applicantName || 'Ứng viên'}
                    {isMine ? ' (Bạn)' : ''}
                  </Text>
                  <Text style={styles.sub}>
                    {LOTTERY_RESULT_LABEL[code] ?? code || '—'}
                    {p.slotCode ? ` · ${p.slotCode}` : ''}
                  </Text>
                </View>
              );
            })}
          </>
        )}
        {applicationId ? (
          <TouchableOpacity
            style={styles.backApp}
            onPress={() => navigation.navigate('ApplicationDetail', { applicationId })}
          >
            <Text style={styles.backAppText}>Về hồ sơ của tôi</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  content: { padding: spacing.lg, paddingBottom: 40 },
  title: { ...typography.h2, color: RHSColors.text },
  meta: { ...typography.caption, color: RHSColors.textMuted, marginVertical: 12 },
  error: { color: RHSColors.red700, marginTop: 16 },
  item: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  mine: { borderColor: RHSColors.blue700, backgroundColor: RHSColors.blue50 },
  name: { fontWeight: '700', color: RHSColors.text },
  sub: { ...typography.caption, color: RHSColors.textMuted, marginTop: 2 },
  backApp: {
    marginTop: 16,
    alignItems: 'center',
    padding: 14,
    borderRadius: borderRadius.lg,
    backgroundColor: RHSColors.blue700,
  },
  backAppText: { color: '#fff', fontWeight: '700' },
});
