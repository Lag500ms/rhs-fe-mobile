import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  type StyleProp,
  type ViewStyle,
  type DimensionValue,
} from 'react-native';
import { RHSColors, borderRadius, spacing } from '../../lib/theme';

/** Nhịp sáng/tối dùng chung cho mọi khối skeleton trong cùng màn hình. */
function usePulse() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
}

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 14,
  radius = borderRadius.sm,
  style,
}) => {
  const opacity = usePulse();
  return (
    <Animated.View
      style={[styles.block, { width, height, borderRadius: radius, opacity }, style]}
    />
  );
};

/** Placeholder cho FlatList thẻ trong lúc chờ dữ liệu. */
export const SkeletonCardList: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <View style={styles.list}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={styles.card}>
        <View style={styles.row}>
          <Skeleton width="55%" height={15} />
          <Skeleton width={72} height={22} radius={borderRadius.full} />
        </View>
        <Skeleton width="38%" height={20} style={{ marginTop: spacing.md }} />
        <Skeleton width="70%" height={12} style={{ marginTop: spacing.sm }} />
        <Skeleton width="45%" height={12} style={{ marginTop: spacing.sm }} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  block: {
    backgroundColor: RHSColors.grey200,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: RHSColors.surfaceCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: RHSColors.border,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
