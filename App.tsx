import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppDialogHost } from './src/components/ui/AppDialogHost';

import { AuthNavigator } from './src/features/auth/AuthNavigator';
import { UserNavigator } from './src/features/user/UserNavigator';
import { MainTabNavigator } from './src/features/main/MainTabNavigator';
import { EKycNavigator } from './src/features/ekyc/EKycNavigator';
import { IssueReportNavigator } from './src/features/issue-reports/IssueReportNavigator';
import { FaqScreen } from './src/features/help/screens/FaqScreen';
import { LookupScreen } from './src/features/lookup/screens/LookupScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Auth: undefined;
  UserProfile: undefined;
  EKyc: undefined;
  IssueReport: undefined;
  Faq: undefined;
  Lookup: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
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
            <Stack.Screen name="Lookup" component={LookupScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        <AppDialogHost />
      </View>
    </SafeAreaProvider>
  );
}
