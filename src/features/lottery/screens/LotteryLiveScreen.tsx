import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { GradientButton } from '../../../components/ui';
import { RHSColors, spacing, typography } from '../../../lib/theme';
import { LotteryJoinCard } from '../components/LotteryJoinCard';
import { LotteryLiveHall } from '../components/LotteryLiveHall';
import { useLotteryLiveSession } from '../hooks/useLotteryLiveSession';
import { isLotteryFinishedPhase, normalizeLotterySession } from '../../application/utils/lotterySession';

type RouteParams = {
  projectId: string;
  projectName?: string;
  applicationId?: string;
};

export const LotteryLiveScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { projectId, projectName, applicationId } = (route.params ?? {}) as RouteParams;
  const session = useLotteryLiveSession(projectId, applicationId);
  const phase = normalizeLotterySession(session.sessionStatus || session.schedule?.sessionStatus);
  const finished = isLotteryFinishedPhase(session.schedule) || phase === 'Finished' || phase === 'Published';

  if (!projectId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Sảnh quay số" onBack={() => navigation.goBack()} isWhite />
        <View style={styles.center}>
          <Text style={styles.error}>
            Chưa chọn dự án. Vào «Bốc thăm của tôi» rồi mở sảnh quay số.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Sảnh quay số" onBack={() => navigation.goBack()} isWhite />
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
          {session.live?.projectName || session.schedule?.projectName || projectName || 'Dự án'}
        </Text>
        <Text style={styles.hub}>{session.hubStatus}</Text>
        {!!session.error && !session.joined && <Text style={styles.error}>{session.error}</Text>}

        {!session.joined ? (
          <>
            {session.joining && (
              <ActivityIndicator color={RHSColors.blue700} style={{ marginBottom: spacing.md }} />
            )}
            <LotteryJoinCard
              otp={session.otp}
              setOtp={session.setOtp}
              joining={session.joining}
              revealedCode={session.schedule?.joinCode}
              onJoin={() => void session.handleJoin()}
            />
          </>
        ) : (
          <>
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
                style={{ marginTop: spacing.lg }}
                onPress={() =>
                  navigation.navigate('LotteryResult', {
                    projectId,
                    projectName: session.live?.projectName || projectName,
                    applicationId,
                  })
                }
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  center: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  content: { padding: spacing.lg, paddingBottom: 48 },
  title: { ...typography.h3, color: RHSColors.text, marginBottom: 4 },
  hub: { ...typography.caption, color: RHSColors.textMuted, marginBottom: spacing.md },
  error: { ...typography.body, color: RHSColors.red600, marginBottom: spacing.md },
});
