import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { RHSColors } from '../../lib/theme';
import { NotificationTabIcon } from '../../components/NotificationTabIcon';

import { HomeNavigator } from '../home/navigation/HomeNavigator';
import { ApplicationNavigator } from '../application/navigation/ApplicationNavigator';
import { SavedScreen } from '../saved/screens/SavedScreen';
import { NotificationNavigator } from '../notification/NotificationNavigator';
import { AccountScreen } from '../account/screens/AccountScreen';

export type MainTabParamList = {
  Home: undefined;
  Applications: undefined;
  Notifications: undefined;
  Saved: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_STYLE = {
  borderTopWidth: 1,
  borderTopColor: RHSColors.border,
  height: 62,
  paddingBottom: 8,
  paddingTop: 6,
  backgroundColor: RHSColors.surfaceCard,
} as const;

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: RHSColors.blue700,
        tabBarInactiveTintColor: RHSColors.textMuted,
        tabBarStyle: TAB_STYLE,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Applications"
        component={ApplicationNavigator}
        options={{
          tabBarLabel: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => <Feather name="file-text" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationNavigator}
        options={{
          tabBarLabel: 'Thông báo',
          tabBarIcon: ({ color, size }) => <NotificationTabIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedScreen}
        options={{
          tabBarLabel: 'Quan tâm',
          tabBarIcon: ({ color, size }) => <Feather name="heart" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarLabel: 'Tài khoản',
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
