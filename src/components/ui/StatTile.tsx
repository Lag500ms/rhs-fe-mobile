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

type StatTileProps = {
  value: string | number;
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  tint?: string;
  /** Dùng trên nền màu đậm (header gradient) */
  onDark?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const StatTile: React.FC<StatTileProps> = ({
  value,
  label,
  icon,
  tint = RHSColors.blue700,
  onDark = false,
  style,
}) => (
  <View
    style={[
      styles.tile,
      onDark ? styles.tileDark : styles.tileLight,
      style,
    ]}
  >
    {!!icon && (
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: onDark ? 'rgba(255,255,255,0.18)' : `${tint}14` },
        ]}
      >
        <Feather name={icon} size={16} color={onDark ? '#FFFFFF' : tint} />
      </View>
    )}
    <Text style={[styles.value, { color: onDark ? '#FFFFFF' : RHSColors.text }]} numberOfLines={1}>
      {value}
    </Text>
    <Text
      style={[styles.label, { color: onDark ? 'rgba(255,255,255,0.85)' : RHSColors.textMuted }]}
      numberOfLines={2}
    >
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  tileLight: {
    backgroundColor: RHSColors.surfaceCard,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  tileDark: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.h3,
    fontWeight: '800',
  },
  label: {
    ...typography.caption,
    fontWeight: '500',
  },
});
