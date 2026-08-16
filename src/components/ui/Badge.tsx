import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RHSColors, borderRadius, spacing, typography } from '../../lib/theme';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: RHSColors.grey100, fg: RHSColors.textSecondary },
  info: { bg: RHSColors.blue50, fg: RHSColors.blue700 },
  success: { bg: RHSColors.green50, fg: RHSColors.green700 },
  warning: { bg: RHSColors.amber50, fg: RHSColors.amber700 },
  danger: { bg: RHSColors.red50, fg: RHSColors.red700 },
};

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  icon?: keyof typeof Feather.glyphMap;
  /** Chấm tròn nhấp nháy cho trạng thái đang diễn ra */
  dot?: boolean;
  /** Ghi đè màu khi dữ liệu backend đã kèm sẵn màu */
  backgroundColor?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  tone = 'neutral',
  icon,
  dot = false,
  backgroundColor,
  color,
  style,
}) => {
  const palette = TONES[tone];
  const bg = backgroundColor ?? palette.bg;
  const fg = color ?? palette.fg;

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: fg }]} />}
      {icon && <Feather name={icon} size={11} color={fg} />}
      <Text style={[styles.text, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    ...typography.caption,
    fontWeight: '700',
  },
});
