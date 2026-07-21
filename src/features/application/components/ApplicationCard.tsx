import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RHSColors, borderRadius, shadows, spacing, typography } from '../../../lib/theme';
import { ApplicationSummary } from '../types/application';
import { getStatusConfig, getActionForStatus } from '../utils/statusConfig';
import { formatDate } from '../utils/format';

interface ApplicationCardProps {
  item: ApplicationSummary;
  onPress: (item: ApplicationSummary) => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ item, onPress }) => {
  const config = getStatusConfig(item.applicationStatus);
  const action = getActionForStatus(item.applicationStatus);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={styles.projectInfo}>
          <View style={styles.projectIconWrap}>
            <Feather name="home" size={16} color={RHSColors.blue700} />
          </View>
          <Text style={styles.projectName} numberOfLines={2}>
            {item.projectName}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: config.bg }]}>
          <View style={[styles.badgeDot, { backgroundColor: config.dotColor }]} />
          <Text style={[styles.badgeText, { color: config.textColor }]}>{config.label}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Feather name="calendar" size={14} color={RHSColors.textMuted} />
          <Text style={styles.cardRowText}>Tạo ngày: {formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.cardRow}>
          <Feather name="file-text" size={14} color={RHSColors.textMuted} />
          <Text style={styles.cardRowText}>{item.documentCount} giấy tờ</Text>
        </View>
      </View>

      {action && (
        <View style={styles.cardFooter}>
          <View style={styles.actionBtn}>
            <Feather name={action.icon as any} size={15} color={action.color} />
            <Text style={[styles.actionBtnText, { color: action.color }]}>{action.label}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={RHSColors.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: RHSColors.surfaceCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: spacing.sm,
  },
  projectIconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: RHSColors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  projectName: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: RHSColors.text,
    flex: 1,
    lineHeight: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 5,
    maxWidth: '46%',
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
  },
  cardBody: {
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingLeft: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardRowText: {
    ...typography.caption,
    color: RHSColors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: RHSColors.grey100,
    paddingTop: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtnText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
});
