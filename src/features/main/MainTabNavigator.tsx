import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

import { HomeScreen } from '../home/screens/HomeScreen';
import { SavedScreen } from '../saved/screens/SavedScreen';
import { AccountScreen } from '../account/screens/AccountScreen';

export type MainTabParamList = {
  Home: undefined;
  Saved: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedScreen}
        options={{
          tabBarLabel: 'Tin đã lưu',
          tabBarIcon: ({ color, size }) => (
            <Feather name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarLabel: 'Tài khoản',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
