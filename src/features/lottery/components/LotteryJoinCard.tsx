import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GradientButton } from '../../../components/ui';
import { OtpInput } from '../../../components/OtpInput';
import { RHSColors, borderRadius, spacing, typography } from '../../../lib/theme';
import { JoinCodeReveal } from './JoinCodeReveal';

export function LotteryJoinCard({
  otp,
  setOtp,
  joining,
  onJoin,
  revealedCode,
}: {
  otp: string;
  setOtp: (v: string) => void;
  joining: boolean;
  onJoin: () => void;
  revealedCode?: string | null;
}) {
  return (
    <View style={styles.joinCard}>
      <Text style={styles.joinHint}>
        Mã 6 số vào sảnh (OTP) được cấp khi Sở duyệt lịch / khi phiên Live mở. Vào sảnh để theo dõi —
        không tự bốc thăm.
      </Text>
      {!!revealedCode && (
        <View style={{ marginBottom: 12 }}>
          <JoinCodeReveal code={revealedCode} />
        </View>
      )}
      <View style={styles.otpWrap}>
        <OtpInput
          value={otp}
          onChange={setOtp}
          editable={!joining}
        />
      </View>
      <GradientButton
        label={joining ? 'Đang vào…' : 'Vào sảnh'}
        icon="log-in"
        loading={joining}
        disabled={joining || otp.length < 6}
        fullWidth
        onPress={onJoin}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  joinCard: {
    backgroundColor: RHSColors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  joinHint: { ...typography.body, color: RHSColors.textMuted, marginBottom: 12 },
  otpWrap: { marginBottom: 12 },
});
