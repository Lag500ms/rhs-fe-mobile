import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RHSColors } from '../lib/theme';

interface BrandBarProps {
  height?: number;
}

export const BrandBar: React.FC<BrandBarProps> = ({ height = 4 }) => (
  <View style={[styles.bar, { height }]}>
    <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.govRed }]} />
    <View style={[styles.stripe, { flex: 0.4, backgroundColor: RHSColors.govGold }]} />
    <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.govBlue }]} />
  </View>
);

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
  },
  stripe: {
    height: '100%',
  },
});