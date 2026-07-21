import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotificationBadge } from '../features/notification/hooks/useNotificationBadge';
import { RHSColors, spacing, borderRadius, typography, shadows } from '../lib/theme';

export const NotificationBell: React.FC = memo(() => {
  const navigation = useNavigation<any>();
  const unreadCount = useNotificationBadge();

  const handlePress = (): void => {
    navigation.navigate('MainTabs', { screen: 'Notifications' });
  };

  const displayCount = unreadCount > 99 ? '99+' : unreadCount.toString();
  const showBadge = unreadCount > 0;

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.7}
    >
      <Ionicons name="notifications-outline" size={24} color={RHSColors.text} />
      {showBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

NotificationBell.displayName = 'NotificationBell';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: RHSColors.red600,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: RHSColors.white,
    ...shadows.sm,
  },
  badgeText: {
    color: RHSColors.white,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});