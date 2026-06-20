import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/HomeScreen';
import { HousingProjectDetailScreen } from '../screens/HousingProjectDetailScreen';
import { MapFullScreen } from '../screens/MapFullScreen';
import { BasicInformationScreen } from '../screens/BasicInformationScreen';
import { UploadDocumentsScreen } from '../screens/UploadDocumentsScreen';
import { ReviewSubmitScreen } from '../screens/ReviewSubmitScreen';
import { MyApplicationsScreen } from '../screens/MyApplicationsScreen';
import { HousingProjectResponse } from '../api/housingApi';

export type HomeStackParamList = {
  HomeList: undefined;
  HousingProjectDetail: { project: HousingProjectResponse };
  MapFull: { latitude: number; longitude: number; projectName: string };
  BasicInformation: { projectId: string; projectName: string };
  UploadDocuments: { applicationId: string; projectName?: string };
  ReviewSubmit: { applicationId: string };
  MyApplications: undefined;
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
      <Stack.Screen name="BasicInformation" component={BasicInformationScreen} />
      <Stack.Screen name="UploadDocuments" component={UploadDocumentsScreen} />
      <Stack.Screen name="ReviewSubmit" component={ReviewSubmitScreen} />
      <Stack.Screen name="MyApplications" component={MyApplicationsScreen} />
    </Stack.Navigator>
  );
};
