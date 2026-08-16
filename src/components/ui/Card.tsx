import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { RHSColors, borderRadius, spacing, shadows } from '../../lib/theme';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Bỏ padding mặc định khi cần nội dung tràn viền (ảnh, gradient...) */
  bare?: boolean;
  /** Bóng đổ rõ hơn cho thẻ nổi bật */
  elevated?: boolean;
  /** Dải màu dọc bên trái để phân loại trạng thái */
  accentColor?: string;
  onPress?: () => void;
};

export const Card: React.FC<CardProps> = ({
  children,
  style,
  bare = false,
  elevated = false,
  accentColor,
  onPress,
}) => {
  const composed = [
    styles.card,
    elevated ? shadows.lg : shadows.sm,
    !bare && styles.padded,
    accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : null,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={composed} onPress={onPress} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={composed}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: RHSColors.surfaceCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: RHSColors.border,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.lg,
  },
});
