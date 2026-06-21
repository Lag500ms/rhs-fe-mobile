import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MyApplicationsScreen } from '../screens/MyApplicationsScreen';
import { BasicInformationScreen } from '../screens/BasicInformationScreen';
import { UploadDocumentsScreen } from '../screens/UploadDocumentsScreen';
import { ReviewSubmitScreen } from '../screens/ReviewSubmitScreen';

export type ApplicationStackParamList = {
  MyApplications: undefined;
  BasicInformation: { projectId: string; projectName: string };
  UploadDocuments: { applicationId: string; projectName?: string };
  ReviewSubmit: { applicationId: string };
};

const Stack = createNativeStackNavigator<ApplicationStackParamList>();

export const ApplicationNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyApplications" component={MyApplicationsScreen} />
      <Stack.Screen name="BasicInformation" component={BasicInformationScreen} />
      <Stack.Screen name="UploadDocuments" component={UploadDocumentsScreen} />
      <Stack.Screen name="ReviewSubmit" component={ReviewSubmitScreen} />
    </Stack.Navigator>
  );
};