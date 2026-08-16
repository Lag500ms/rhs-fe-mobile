import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { GradientButton } from '../../../components/ui';
import { RHSColors, borderRadius, spacing, typography } from '../../../lib/theme';

export function LotteryJoinCard({
  otp,
  setOtp,
  joining,
  onJoin,
}: {
  otp: string;
  setOtp: (v: string) => void;
  joining: boolean;
  onJoin: () => void;
}) {
  return (
    <View style={styles.joinCard}>
      <Text style={styles.joinHint}>
        Nhập mã xác thực 6 số từ thông báo sau khi Sở duyệt lịch. Vào sảnh để theo dõi — không tự bốc
        thăm.
      </Text>
      <TextInput
        style={styles.otpInput}
        value={otp}
        onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        placeholderTextColor={RHSColors.textMuted}
        keyboardType="number-pad"
        maxLength={6}
        editable={!joining}
      />
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
  otpInput: {
    borderWidth: 1,
    borderColor: RHSColors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 22,
    letterSpacing: 8,
    fontWeight: '700',
    textAlign: 'center',
    color: RHSColors.text,
    marginBottom: 12,
    backgroundColor: RHSColors.surface,
  },
});
