import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RHSColors } from '../lib/theme';

type Props = {
  active: boolean;
  loading?: boolean;
  onPress: () => void;
  size?: number;
  style?: ViewStyle;
  onImage?: boolean;
};

/** Nút yêu thích — Ionicons heart filled/outline + spring animation */
export const WishlistHeart: React.FC<Props> = ({
  active,
  loading = false,
  onPress,
  size = 22,
  style,
  onImage = false,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) return;
    scale.setValue(0.55);
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 180,
      useNativeDriver: true,
    }).start();
  }, [active, scale]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[styles.btn, onImage && styles.onImage, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={RHSColors.red600} />
      ) : (
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons
            name={active ? 'heart' : 'heart-outline'}
            size={size}
            color={active ? RHSColors.red600 : onImage ? '#fff' : RHSColors.textMuted}
          />
        </Animated.View>
      )}
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
  },
  onImage: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
});
