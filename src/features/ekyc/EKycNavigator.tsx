import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { EKycScreen } from './screens/EKycScreen';

export type EKycStackParamList = {
  EKycHome: { returnTo?: string; applicationData?: any } | undefined;
};

const Stack = createNativeStackNavigator<EKycStackParamList>();

export const EKycNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="EKycHome" component={EKycScreen} />
    </Stack.Navigator>
  );
};