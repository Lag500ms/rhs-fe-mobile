import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MyApplicationsScreen } from '../screens/MyApplicationsScreen';
import { BasicInformationScreen } from '../screens/BasicInformationScreen';
import { EditInformationScreen } from '../screens/EditInformationScreen';
import { UploadDocumentsScreen } from '../screens/UploadDocumentsScreen';
import { ReviewSubmitScreen } from '../screens/ReviewSubmitScreen';

export type ApplicationStackParamList = {
  MyApplications: undefined;
  BasicInformation: { projectId: string; projectName: string };
  EditInformation: { applicationId: string };
  UploadDocuments: { applicationId: string; projectName?: string; applicationStatus?: string };
  ReviewSubmit: { applicationId: string };
};

const Stack = createNativeStackNavigator<ApplicationStackParamList>();

export const ApplicationNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyApplications" component={MyApplicationsScreen} />
      <Stack.Screen name="BasicInformation" component={BasicInformationScreen} />
      <Stack.Screen name="EditInformation" component={EditInformationScreen} />
      <Stack.Screen name="UploadDocuments" component={UploadDocumentsScreen} />
      <Stack.Screen name="ReviewSubmit" component={ReviewSubmitScreen} />
    </Stack.Navigator>
  );
};