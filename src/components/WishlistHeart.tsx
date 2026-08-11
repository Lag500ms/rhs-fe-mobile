import React, { useRef, useEffect, useCallback } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  View,
  ViewStyle,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RHSColors } from '../lib/theme';

type Props = {
  active: boolean;
  loading?: boolean;
  onPress: () => void;
  size?: number;
  style?: ViewStyle;
  onImage?: boolean;
};

const BURST_COUNT = 6;
const BURST_COLORS = [RHSColors.red600, '#FF8A80', '#EF5350', '#FFCDD2', RHSColors.red400, '#E57373'];

type BurstParticle = {
  progress: Animated.Value;
  angle: number;
  distance: number;
  size: number;
  color: string;
};

/** Nút yêu thích — bounce + burst + haptic */
export const WishlistHeart: React.FC<Props> = ({
  active,
  loading = false,
  onPress,
  size = 22,
  style,
  onImage = false,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const heartOpacity = useRef(new Animated.Value(1)).current;
  const didMount = useRef(false);
  const prevActive = useRef(active);
  const particles = useRef<BurstParticle[]>(
    Array.from({ length: BURST_COUNT }, (_, i) => ({
      progress: new Animated.Value(0),
      angle: (Math.PI * 2 * i) / BURST_COUNT + Math.PI * 0.65,
      distance: 10 + (i % 3) * 3,
      size: 3 + (i % 2),
      color: BURST_COLORS[i % BURST_COLORS.length],
    })),
  ).current;

  const playLike = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);

    scale.setValue(0.35);
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.28,
        friction: 3,
        tension: 220,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start();

    particles.forEach((p) => {
      p.progress.setValue(0);
      Animated.timing(p.progress, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [particles, scale]);

  const playUnlike = useCallback(() => {
    void Haptics.selectionAsync().catch(() => undefined);
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.82,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale]);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      prevActive.current = active;
      return;
    }
    if (active && !prevActive.current) {
      playLike();
    } else if (!active && prevActive.current) {
      playUnlike();
    }
    prevActive.current = active;
  }, [active, playLike, playUnlike]);

  useEffect(() => {
    Animated.timing(heartOpacity, {
      toValue: loading ? 0.45 : 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [loading, heartOpacity]);

  const iconColor = active
    ? RHSColors.red600
    : onImage
      ? '#fff'
      : RHSColors.textMuted;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={[styles.btn, onImage && styles.onImage, style]}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Bỏ quan tâm' : 'Quan tâm'}
    >
      <View style={styles.stage} pointerEvents="none">
        {particles.map((p, index) => {
          const translateX = p.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.cos(p.angle) * p.distance],
          });
          const translateY = p.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.sin(p.angle) * p.distance],
          });
          const opacity = p.progress.interpolate({
            inputRange: [0, 0.15, 1],
            outputRange: [0, 1, 0],
          });
          const particleScale = p.progress.interpolate({
            inputRange: [0, 0.2, 1],
            outputRange: [0.4, 1, 0.2],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  width: p.size,
                  height: p.size,
                  borderRadius: p.size / 2,
                  backgroundColor: p.color,
                  opacity,
                  transform: [{ translateX }, { translateY }, { scale: particleScale }],
                },
              ]}
            />
          );
        })}

        <Animated.View style={{ opacity: heartOpacity, transform: [{ scale }] }}>
          <Ionicons
            name={active ? 'heart' : 'heart-outline'}
            size={size}
            color={iconColor}
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  onImage: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  stage: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
  },
});
