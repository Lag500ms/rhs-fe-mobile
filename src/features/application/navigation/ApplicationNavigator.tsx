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
import { MyContractsScreen } from '../screens/MyContractsScreen';
import { PriorityGroupScreen } from '../screens/PriorityGroupScreen';
import { PaymentWebViewScreen } from '../../payment/screens/PaymentWebViewScreen';
import { PaymentProcessingScreen } from '../../payment/screens/PaymentProcessingScreen';
import { PaymentSuccessScreen } from '../../payment/screens/PaymentSuccessScreen';
import { PaymentScheduleScreen } from '../../payment/screens/PaymentScheduleScreen';
import { MyPaymentsScreen } from '../../payment/screens/MyPaymentsScreen';
import { LotteryScheduleScreen } from '../../lottery/screens/LotteryScheduleScreen';
import { LotteryLobbyScreen } from '../../lottery/screens/LotteryLobbyScreen';
import { LotteryResultScreen } from '../../lottery/screens/LotteryResultScreen';
import { LotteryLiveScreen } from '../../lottery/screens/LotteryLiveScreen';
import { MyLotteryScreen } from '../../lottery/screens/MyLotteryScreen';

import { PaymentStackParamList } from '../../payment/navigation/PaymentNavigator';

export type ApplicationStackParamList = {
  MyApplications: undefined;
  MyLottery: undefined;
  MyContracts: undefined;
  MyPayments: undefined;
  ApplicationDetail: { applicationId: string };
  BasicInformation: { projectId: string; projectName: string };
  PriorityGroup: {
    draftPersonal: import('../types/applicationDraft').ApplicationDraftPersonal;
    draftMembers?: import('../types/applicationDraft').ApplicationDraftMember[];
  };
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
    applicationId?: string;
    projectName?: string;
    applicationStatus?: string;
    next?: 'UploadDocuments' | 'PriorityGroup';
    draftPersonal?: import('../types/applicationDraft').ApplicationDraftPersonal;
  };
  PaymentSchedule: { applicationId: string; projectName?: string };
  LotterySchedule: { projectId: string; projectName?: string; applicationId?: string };
  LotteryLobby: { projectId: string; projectName?: string; applicationId?: string };
  LotteryLive: { projectId: string; projectName?: string; applicationId?: string };
  LotteryResult: { projectId: string; projectName?: string; applicationId?: string };
} & PaymentStackParamList;

const Stack = createNativeStackNavigator<ApplicationStackParamList>();

export const ApplicationNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyApplications" component={MyApplicationsScreen} />
      <Stack.Screen name="MyLottery" component={MyLotteryScreen} />
      <Stack.Screen name="MyContracts" component={MyContractsScreen} />
      <Stack.Screen name="MyPayments" component={MyPaymentsScreen} />
      <Stack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} />
      <Stack.Screen name="BasicInformation" component={BasicInformationScreen} />
      <Stack.Screen name="HouseholdMembers" component={HouseholdMembersScreen} />
      <Stack.Screen name="PriorityGroup" component={PriorityGroupScreen} />
      <Stack.Screen name="UploadDocuments" component={UploadDocumentsScreen} />
      <Stack.Screen name="ReviewSubmit" component={ReviewSubmitScreen} />
      <Stack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
      <Stack.Screen name="PaymentProcessing" component={PaymentProcessingScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <Stack.Screen name="ContractViewer" component={ContractViewerScreen} />
      <Stack.Screen name="WithdrawApplication" component={WithdrawApplicationScreen} />
      <Stack.Screen name="PaymentSchedule" component={PaymentScheduleScreen} />
      <Stack.Screen name="LotterySchedule" component={LotteryScheduleScreen} />
      <Stack.Screen name="LotteryLobby" component={LotteryLobbyScreen} />
      <Stack.Screen name="LotteryLive" component={LotteryLiveScreen} />
      <Stack.Screen name="LotteryResult" component={LotteryResultScreen} />
    </Stack.Navigator>
  );
};
