import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { IssueReportScreen } from './screens/IssueReportScreen';

export type IssueReportStackParamList = {
  IssueReportHome: undefined;
};

const Stack = createNativeStackNavigator<IssueReportStackParamList>();

export const IssueReportNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="IssueReportHome" component={IssueReportScreen} />
    </Stack.Navigator>
  );
};