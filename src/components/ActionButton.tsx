import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RHSColors, borderRadius } from '../lib/theme';

interface ActionButtonProps {
  icon: string;
  text: string;
  onPress?: () => void;
  color?: string;
  showChevron?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leftBorderColor?: string;
  isDestructive?: boolean;
  last?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  text,
  onPress,
  color = RHSColors.blue700,
  showChevron = true,
  disabled = false,
  loading = false,
  leftBorderColor,
  isDestructive = false,
  last = false,
}) => {
  const iconColor = isDestructive ? RHSColors.red600 : color;
  const textColor = isDestructive ? RHSColors.red600 : color;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        last && { marginBottom: 30 },
        leftBorderColor ? { borderLeftWidth: 4, borderLeftColor: leftBorderColor } : null,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.65}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <Feather name={icon as any} size={18} color={iconColor} />
      )}
      <Text style={[styles.text, { color: textColor }]}>{text}</Text>
      {showChevron && !loading && (
        <Feather name="chevron-right" size={18} color={RHSColors.grey400} />
      )}
    </TouchableOpacity>
  );
};

interface SubmitButtonProps {
  text: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  color?: string;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  text,
  onPress,
  disabled = false,
  loading = false,
  color = RHSColors.blue700,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.submitBtn,
        !disabled && { backgroundColor: color },
        disabled && { backgroundColor: RHSColors.grey200 },
      ]}
      disabled={disabled || loading}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[
          styles.submitText,
          !disabled && { color: '#fff' },
          disabled && { color: RHSColors.textMuted },
        ]}>{text}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  text: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  submitBtn: {
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
  },
});