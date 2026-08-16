import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RHSColors, spacing, typography } from '../../lib/theme';
import {
  EmptyStateIllustration,
  type EmptyIllustrationName,
} from '../EmptyStateIllustration';
import { GradientButton } from './GradientButton';

type EmptyStateProps = {
  title: string;
  description?: string;
  /** Ưu tiên minh hoạ SVG; nếu không có thì rơi về icon tròn */
  illustration?: EmptyIllustrationName;
  icon?: keyof typeof Feather.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  illustration,
  icon = 'inbox',
  actionLabel,
  onAction,
}) => (
  <View style={styles.wrap}>
    {illustration ? (
      <EmptyStateIllustration name={illustration} size={190} />
    ) : (
      <View style={styles.iconOuter}>
        <View style={styles.iconInner}>
          <Feather name={icon} size={32} color={RHSColors.blue700} />
        </View>
      </View>
    )}
    <Text style={styles.title}>{title}</Text>
    {!!description && <Text style={styles.description}>{description}</Text>}
    {!!actionLabel && !!onAction && (
      <GradientButton
        label={actionLabel}
        onPress={onAction}
        size="sm"
        pill
        style={styles.action}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.xl,
  },
  iconOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: RHSColors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: RHSColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
    color: RHSColors.text,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  description: {
    ...typography.bodySmall,
    color: RHSColors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 300,
  },
  action: {
    marginTop: spacing.xl,
  },
});
