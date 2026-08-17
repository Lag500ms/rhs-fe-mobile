import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { RHSColors, borderRadius, spacing, typography } from '../../../lib/theme';

type Props = {
  code: string;
  compact?: boolean;
};

/** Hiện mã OTP vào sảnh — luôn đọc được, có sao chép. */
export function JoinCodeReveal({ code, compact }: Props) {
  const [copied, setCopied] = useState(false);
  const value = code.trim();
  if (!value) return null;

  const copy = async () => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <View style={[styles.box, compact && styles.boxCompact]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>Mã vào sảnh</Text>
        <Text style={[styles.code, compact && styles.codeCompact]}>{value}</Text>
      </View>
      <TouchableOpacity style={styles.copyBtn} onPress={() => void copy()} activeOpacity={0.8}>
        <Feather
          name={copied ? 'check' : 'copy'}
          size={14}
          color={copied ? RHSColors.green700 : RHSColors.blue700}
        />
        <Text style={[styles.copyText, copied && { color: RHSColors.green700 }]}>
          {copied ? 'Đã chép' : 'Sao chép'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: RHSColors.blue50,
    borderWidth: 1,
    borderColor: RHSColors.blue200,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  boxCompact: {
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  label: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: RHSColors.blue700,
  },
  code: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
    color: RHSColors.blue800,
    marginTop: 2,
  },
  codeCompact: { fontSize: 18, letterSpacing: 3 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  copyText: { fontSize: 12, fontWeight: '700', color: RHSColors.blue700 },
});
