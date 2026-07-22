import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NotificationListScreen } from './screens/NotificationListScreen';

export type NotificationStackParamList = {
  NotificationHome: undefined;
};

const Stack = createNativeStackNavigator<NotificationStackParamList>();

export const NotificationNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="NotificationHome" component={NotificationListScreen} />
  </Stack.Navigator>
);
