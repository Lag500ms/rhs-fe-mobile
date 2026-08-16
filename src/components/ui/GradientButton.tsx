import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RHSColors, borderRadius, spacing, typography, shadows } from '../../lib/theme';

export type ButtonVariant = 'primary' | 'success' | 'danger' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const GRADIENTS: Record<'primary' | 'success' | 'danger', readonly [string, string]> = {
  primary: [RHSColors.blue800, RHSColors.blue600],
  success: [RHSColors.green700, RHSColors.green600],
  danger: [RHSColors.red700, RHSColors.red600],
};

const GLOW: Record<'primary' | 'success' | 'danger', string> = {
  primary: RHSColors.blue700,
  success: RHSColors.green600,
  danger: RHSColors.red600,
};

const SIZES: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number; icon: number }> = {
  sm: { height: 38, paddingHorizontal: spacing.lg, fontSize: 13, icon: 15 },
  md: { height: 48, paddingHorizontal: spacing.xl, fontSize: 15, icon: 17 },
  lg: { height: 56, paddingHorizontal: spacing.xxl, fontSize: 16, icon: 19 },
};

type GradientButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Feather.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  /** Bo tròn hoàn toàn kiểu viên thuốc */
  pill?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const GradientButton: React.FC<GradientButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  pill = false,
  fullWidth = false,
  style,
}) => {
  const dims = SIZES[size];
  const isFlat = variant === 'outline' || variant === 'ghost';
  const inactive = disabled || loading;
  const radius = pill ? borderRadius.full : borderRadius.md;

  const foreground = isFlat
    ? variant === 'outline'
      ? RHSColors.blue700
      : RHSColors.textSecondary
    : '#FFFFFF';

  const content = (
    <>
      {loading ? (
        <ActivityIndicator size="small" color={foreground} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Feather name={icon} size={dims.icon} color={foreground} />
          )}
          <Text style={[styles.label, { fontSize: dims.fontSize, color: foreground }]}>
            {label}
          </Text>
          {icon && iconPosition === 'right' && (
            <Feather name={icon} size={dims.icon} color={foreground} />
          )}
        </>
      )}
    </>
  );

  const shell: StyleProp<ViewStyle> = [
    styles.shell,
    {
      height: dims.height,
      paddingHorizontal: dims.paddingHorizontal,
      borderRadius: radius,
    },
    fullWidth && styles.fullWidth,
  ];

  if (isFlat) {
    return (
      <TouchableOpacity
        style={[
          shell,
          variant === 'outline' ? styles.outline : styles.ghost,
          inactive && styles.inactive,
          style,
        ]}
        onPress={onPress}
        disabled={inactive}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        fullWidth && styles.fullWidth,
        { borderRadius: radius },
        !inactive && { ...shadows.md, shadowColor: GLOW[variant], shadowOpacity: 0.3 },
        style,
      ]}
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.85}
    >
      {inactive ? (
        <View style={[shell, styles.disabledFill]}>{content}</View>
      ) : (
        <LinearGradient
          colors={GRADIENTS[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={shell}
        >
          {content}
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  label: {
    ...typography.button,
    fontWeight: '700',
  },
  outline: {
    borderWidth: 1.5,
    borderColor: RHSColors.blue700,
    backgroundColor: RHSColors.surfaceCard,
  },
  ghost: {
    borderWidth: 1,
    borderColor: RHSColors.border,
    backgroundColor: RHSColors.surfaceCard,
  },
  disabledFill: {
    backgroundColor: RHSColors.grey200,
  },
  inactive: {
    opacity: 0.5,
  },
});
