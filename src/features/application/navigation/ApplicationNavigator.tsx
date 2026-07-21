import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MyApplicationsScreen } from '../screens/MyApplicationsScreen';
import { ApplicationDetailScreen } from '../screens/ApplicationDetailScreen';
import { BasicInformationScreen } from '../screens/BasicInformationScreen';
import { UploadDocumentsScreen } from '../screens/UploadDocumentsScreen';
import { ReviewSubmitScreen } from '../screens/ReviewSubmitScreen';
import { ContractViewerScreen } from '../screens/ContractViewerScreen';
import { WithdrawApplicationScreen } from '../screens/WithdrawApplicationScreen';
import { HouseholdMembersScreen } from '../screens/HouseholdMembersScreen';
import { PaymentWebViewScreen } from '../../payment/screens/PaymentWebViewScreen';
import { PaymentProcessingScreen } from '../../payment/screens/PaymentProcessingScreen';
import { PaymentSuccessScreen } from '../../payment/screens/PaymentSuccessScreen';
import { PaymentScheduleScreen } from '../../payment/screens/PaymentScheduleScreen';

import { PaymentStackParamList } from '../../payment/navigation/PaymentNavigator';

export type ApplicationStackParamList = {
  MyApplications: undefined;
  ApplicationDetail: { applicationId: string };
  BasicInformation: { projectId: string; projectName: string };
  UploadDocuments: { applicationId: string; projectName?: string; applicationStatus?: string };
  ReviewSubmit: { applicationId: string; applicationStatus?: string };
  ContractViewer: {
    applicationId?: string;
    pdfUrl?: string;
    title: string;
    canSign?: boolean;
  };
  WithdrawApplication: { applicationId: string; projectName?: string };
  HouseholdMembers: {
    applicationId: string;
    projectName?: string;
    applicationStatus?: string;
    next?: 'UploadDocuments';
  };
  PaymentSchedule: { applicationId: string; projectName?: string };
} & PaymentStackParamList;

const Stack = createNativeStackNavigator<ApplicationStackParamList>();

export const ApplicationNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyApplications" component={MyApplicationsScreen} />
      <Stack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} />
      <Stack.Screen name="BasicInformation" component={BasicInformationScreen} />
      <Stack.Screen name="UploadDocuments" component={UploadDocumentsScreen} />
      <Stack.Screen name="ReviewSubmit" component={ReviewSubmitScreen} />
      <Stack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
      <Stack.Screen name="PaymentProcessing" component={PaymentProcessingScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <Stack.Screen name="ContractViewer" component={ContractViewerScreen} />
      <Stack.Screen name="WithdrawApplication" component={WithdrawApplicationScreen} />
      <Stack.Screen name="HouseholdMembers" component={HouseholdMembersScreen} />
      <Stack.Screen name="PaymentSchedule" component={PaymentScheduleScreen} />
    </Stack.Navigator>
  );
};
