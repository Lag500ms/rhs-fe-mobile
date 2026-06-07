import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RHSColors } from '../../../lib/theme';

export const Divider = ({ text = 'Hoặc đăng nhập với' }: { text?: string }) => {
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{text}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
};

const styles = StyleSheet.create({
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: RHSColors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: RHSColors.textMuted,
    fontSize: 14,
  },
});