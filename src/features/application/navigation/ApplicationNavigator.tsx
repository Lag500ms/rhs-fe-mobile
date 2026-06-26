import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MyApplicationsScreen } from '../screens/MyApplicationsScreen';
import { BasicInformationScreen } from '../screens/BasicInformationScreen';
import { EditInformationScreen } from '../screens/EditInformationScreen';
import { UploadDocumentsScreen } from '../screens/UploadDocumentsScreen';
import { ReviewSubmitScreen } from '../screens/ReviewSubmitScreen';
import { ContractViewerScreen } from '../screens/ContractViewerScreen';
import { PaymentWebViewScreen } from '../../payment/screens/PaymentWebViewScreen';
import { PaymentProcessingScreen } from '../../payment/screens/PaymentProcessingScreen';
import { PaymentSuccessScreen } from '../../payment/screens/PaymentSuccessScreen';

import { PaymentStackParamList } from '../../payment/navigation/PaymentNavigator';

export type ApplicationStackParamList = {
  MyApplications: undefined;
  BasicInformation: { projectId: string; projectName: string };
  EditInformation: { applicationId: string };
  UploadDocuments: { applicationId: string; projectName?: string; applicationStatus?: string };
  ReviewSubmit: { applicationId: string };
  ContractViewer: {
    pdfUrl: string;
    title: string;
  };
} & PaymentStackParamList;

const Stack = createNativeStackNavigator<ApplicationStackParamList>();

export const ApplicationNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyApplications" component={MyApplicationsScreen} />
      <Stack.Screen name="BasicInformation" component={BasicInformationScreen} />
      <Stack.Screen name="EditInformation" component={EditInformationScreen} />
      <Stack.Screen name="UploadDocuments" component={UploadDocumentsScreen} />
      <Stack.Screen name="ReviewSubmit" component={ReviewSubmitScreen} />
      <Stack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
      <Stack.Screen name="PaymentProcessing" component={PaymentProcessingScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <Stack.Screen name="ContractViewer" component={ContractViewerScreen} />
    </Stack.Navigator>
  );
};
