import React from 'react';
import { Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { Card, GradientButton } from '../../../components/ui';
import { RHSColors, spacing, typography } from '../../../lib/theme';
import { LotteryJoinCard } from '../components/LotteryJoinCard';
import { LotteryLiveHall } from '../components/LotteryLiveHall';
import { useLotteryLiveSession } from '../hooks/useLotteryLiveSession';
import { LOTTERY_SESSION_LABEL } from '../types/lottery';
import { isLotteryFinishedPhase, normalizeLotterySession } from '../../application/utils/lotterySession';

type RouteParams = {
  projectId: string;
  projectName?: string;
  applicationId?: string;
};

export const LotteryLobbyScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { projectId, projectName, applicationId } = (route.params ?? {}) as RouteParams;
  const session = useLotteryLiveSession(projectId, applicationId);
  const phase = normalizeLotterySession(session.sessionStatus || session.schedule?.sessionStatus);
  const finished = isLotteryFinishedPhase(session.schedule) || phase === 'Finished' || phase === 'Published';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Sảnh bốc thăm" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              void session.loadSchedule();
              if (session.joined) void session.loadLive();
            }}
            colors={[RHSColors.blue700]}
            tintColor={RHSColors.blue700}
          />
        }
      >
        <Text style={styles.title}>
          {session.live?.projectName || session.schedule?.projectName || projectName || 'Phiên bốc thăm'}
        </Text>
        <Text style={styles.hub}>{session.hubStatus}</Text>
        {!!session.error && !session.joined && <Text style={styles.error}>{session.error}</Text>}

        {!session.joined ? (
          <LotteryJoinCard
            otp={session.otp}
            setOtp={session.setOtp}
            joining={session.joining}
            revealedCode={session.schedule?.joinCode}
            onJoin={() => void session.handleJoin()}
          />
        ) : (
          <>
            <Card style={styles.waitCard}>
              <Text style={styles.waitTitle}>
                {LOTTERY_SESSION_LABEL[phase] ?? (phase || 'Đang chờ phiên')}
              </Text>
              <Text style={styles.waitBody}>
                Bạn không tự bốc. Chủ đầu tư công bố từng hồ sơ trên sảnh quay số; căn hộ được chọn sau.
              </Text>
              {session.sxdCount < 1 && (
                <Text style={styles.warn}>Chưa có cán bộ Sở trong sảnh — phiên Live chưa thể bắt đầu.</Text>
              )}
            </Card>

            <LotteryLiveHall
              live={session.live}
              applicationId={applicationId}
              logs={session.logs}
              hubOk={session.hubOk}
              hubLabel={session.hubStatus}
              restMode={session.useRestMode}
            />

            {finished && (
              <GradientButton
                label="Xem kết quả công bố"
                icon="award"
                variant="success"
                fullWidth
                style={{ marginTop: spacing.md }}
                onPress={() =>
                  navigation.navigate('LotteryResult', {
                    projectId,
                    projectName: session.schedule?.projectName || projectName,
                    applicationId,
                  })
                }
              />
            )}

            {session.myResult && isWonish(session.myResult.result) && applicationId ? (
              <GradientButton
                label="Về hồ sơ — chờ CĐT chọn căn"
                icon="file-text"
                variant="outline"
                fullWidth
                style={{ marginTop: spacing.sm }}
                onPress={() => navigation.navigate('ApplicationDetail', { applicationId })}
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

function isWonish(result?: string | null) {
  const r = String(result || '').toUpperCase();
  return r === 'WON' || r === 'PRIORITY_WON';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  content: { padding: spacing.lg, paddingBottom: 48 },
  title: { ...typography.h2, color: RHSColors.text },
  hub: { ...typography.caption, color: RHSColors.textMuted, marginTop: 4, marginBottom: 16 },
  error: { ...typography.caption, color: RHSColors.red700, marginBottom: spacing.md },
  waitCard: { gap: spacing.xs, marginBottom: spacing.md },
  waitTitle: { ...typography.bodySmall, fontWeight: '800', color: RHSColors.text },
  waitBody: { ...typography.caption, color: RHSColors.textSecondary, lineHeight: 18 },
  warn: { ...typography.caption, color: RHSColors.red700, marginTop: spacing.xs },
});
