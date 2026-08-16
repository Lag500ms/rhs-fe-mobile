import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RHSColors, borderRadius, spacing, typography } from '../../lib/theme';

type ProgressBarProps = {
  /** Giá trị 0–1 */
  value: number;
  label?: string;
  /** Chữ hiển thị bên phải, mặc định là phần trăm */
  valueLabel?: string;
  height?: number;
  colors?: readonly [string, string];
  showPercent?: boolean;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  valueLabel,
  height = 8,
  colors = [RHSColors.blue600, RHSColors.blue400],
  showPercent = true,
}) => {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [anim, clamped]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const rightText = valueLabel ?? (showPercent ? `${Math.round(clamped * 100)}%` : undefined);

  return (
    <View>
      {(label || rightText) && (
        <View style={styles.head}>
          {!!label && <Text style={styles.label}>{label}</Text>}
          {!!rightText && <Text style={styles.value}>{rightText}</Text>}
        </View>
      )}
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <Animated.View style={{ width, height: '100%', borderRadius: height / 2 }}>
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: height / 2 }]}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: RHSColors.textSecondary,
    fontWeight: '600',
  },
  value: {
    ...typography.caption,
    color: RHSColors.text,
    fontWeight: '800',
  },
  track: {
    backgroundColor: RHSColors.grey200,
    overflow: 'hidden',
    borderRadius: borderRadius.full,
  },
});
