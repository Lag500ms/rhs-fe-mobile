import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthNavigator } from './src/features/auth/AuthNavigator';
import { UserNavigator } from './src/features/user/UserNavigator';
import { MainTabNavigator } from './src/features/main/MainTabNavigator';
import { EKycNavigator } from './src/features/ekyc/EKycNavigator';
import { IssueReportNavigator } from './src/features/issue-reports/IssueReportNavigator';
import { FaqScreen } from './src/features/help/screens/FaqScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Auth: undefined;
  UserProfile: undefined;
  EKyc: { returnTo?: string } | undefined;
  IssueReport: undefined;
  Faq: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="UserProfile" component={UserNavigator} />
        <Stack.Screen name="EKyc" component={EKycNavigator} />
        <Stack.Screen name="IssueReport" component={IssueReportNavigator} />
        <Stack.Screen name="Faq" component={FaqScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
