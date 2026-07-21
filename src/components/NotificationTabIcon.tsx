import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNotificationBadge } from '../features/notification/hooks/useNotificationBadge';
import { RHSColors } from '../lib/theme';

type Props = {
  color: string;
  size: number;
};

/** Icon tab Thông báo kèm badge số chưa đọc */
export const NotificationTabIcon: React.FC<Props> = ({ color, size }) => {
  const unread = useNotificationBadge();
  const show = unread > 0;

  return (
    <View style={styles.wrap}>
      <Feather name="bell" size={size} color={color} />
      {show && <View style={styles.dot} />}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: RHSColors.red600,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
});
