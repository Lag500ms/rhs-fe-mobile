import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RHSColors } from '../lib/theme';

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
  color = RHSColors.govBlue,
  showChevron = true,
  disabled = false,
  loading = false,
  leftBorderColor,
  isDestructive = false,
  last = false,
}) => {
  const iconColor = isDestructive ? RHSColors.govRed : color;
  const textColor = isDestructive ? RHSColors.govRed : color;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        last && { marginBottom: 30 },
        leftBorderColor ? { borderLeftWidth: 4, borderLeftColor: leftBorderColor } : null,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <Feather name={icon as any} size={20} color={iconColor} />
      )}
      <Text style={[styles.text, { color: textColor }]}>{text}</Text>
      {showChevron && !loading && (
        <Feather name={isDestructive ? 'alert-triangle' : 'chevron-right'} size={20} color={RHSColors.textMuted} />
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
  color = RHSColors.govBlue,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.submitBtn,
        !disabled && { backgroundColor: color },
        disabled && { backgroundColor: RHSColors.surface },
      ]}
      disabled={disabled || loading}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={RHSColors.white} />
      ) : (
        <Text style={[
          styles.submitText,
          !disabled && { color: RHSColors.white },
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
    backgroundColor: RHSColors.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: RHSColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  text: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  submitBtn: {
    height: 52,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
  },
});