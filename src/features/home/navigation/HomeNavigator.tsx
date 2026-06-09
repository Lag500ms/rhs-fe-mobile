import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/HomeScreen';
import { HousingProjectDetailScreen } from '../screens/HousingProjectDetailScreen';
import { MapFullScreen } from '../screens/MapFullScreen';
import { HousingProjectResponse } from '../api/housingApi';

export type HomeStackParamList = {
  HomeList: undefined;
  HousingProjectDetail: { project: HousingProjectResponse };
  MapFull: { latitude: number; longitude: number; projectName: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="HomeList" component={HomeScreen} />
      <Stack.Screen name="HousingProjectDetail" component={HousingProjectDetailScreen} />
      <Stack.Screen name="MapFull" component={MapFullScreen} />
    </Stack.Navigator>
  );
};