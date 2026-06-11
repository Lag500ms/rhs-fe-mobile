import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RHSColors } from '../lib/theme';

interface InfoRowProps {
  label: string;
  value: string;
  isHighlight?: boolean;
  last?: boolean;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value, isHighlight, last }) => (
  <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[
      styles.infoValue,
      isHighlight === true && { color: RHSColors.govGreen },
      isHighlight === false && { color: RHSColors.govRed },
    ]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.surface,
  },
  infoLabel: {
    fontSize: 14,
    color: RHSColors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: RHSColors.text,
    maxWidth: '55%',
    textAlign: 'right',
  },
});