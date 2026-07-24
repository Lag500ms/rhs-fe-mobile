import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/HomeScreen';
import { HousingProjectDetailScreen } from '../screens/HousingProjectDetailScreen';
import { MapFullScreen } from '../screens/MapFullScreen';
import { AnnouncementsScreen } from '../screens/AnnouncementsScreen';
import { LotteryScheduleScreen } from '../../lottery/screens/LotteryScheduleScreen';
import { LotteryLobbyScreen } from '../../lottery/screens/LotteryLobbyScreen';
import { LotteryResultScreen } from '../../lottery/screens/LotteryResultScreen';
import { HousingProjectResponse } from '../types/housing';

export type HomeStackParamList = {
  HomeList: undefined;
  HousingProjectDetail: { project: HousingProjectResponse };
  MapFull: { latitude: number; longitude: number; projectName: string };
  Announcements: { announcementId?: string } | undefined;
  LotterySchedule: { projectId: string; projectName?: string; applicationId?: string };
  LotteryLobby: { projectId: string; projectName?: string; applicationId?: string };
  LotteryResult: { projectId: string; projectName?: string; applicationId?: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeList" component={HomeScreen} />
      <Stack.Screen name="HousingProjectDetail" component={HousingProjectDetailScreen} />
      <Stack.Screen name="MapFull" component={MapFullScreen} />
      <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
      <Stack.Screen name="LotterySchedule" component={LotteryScheduleScreen} />
      <Stack.Screen name="LotteryLobby" component={LotteryLobbyScreen} />
      <Stack.Screen name="LotteryResult" component={LotteryResultScreen} />
    </Stack.Navigator>
  );
};
