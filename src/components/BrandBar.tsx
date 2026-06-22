import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Thin 3px gradient top border (Red - Gold - Blue)
 * Represents the national flag colors in a subtle, modern way
 * similar to GOV.UK or Singapore government websites.
 */
export const BrandBar: React.FC = () => (
  <View style={styles.bar}>
    <View style={[styles.stripe, { flex: 2, backgroundColor: '#D32F2F' }]} />
    <View style={[styles.stripe, { flex: 0.3, backgroundColor: '#F9A825' }]} />
    <View style={[styles.stripe, { flex: 2, backgroundColor: '#1565C0' }]} />
  </View>
);

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 3,
  },
  stripe: {
    height: '100%',
  },
});