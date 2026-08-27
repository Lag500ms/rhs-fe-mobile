import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ProfileScreen } from './screens/ProfileScreen';
import { EditProfileScreen } from './screens/EditProfileScreen';
import { ChangePasswordScreen } from './screens/ChangePasswordScreen';
import { DeleteAccountScreen } from './screens/DeleteAccountScreen';
import { CitizenProfileHubScreen } from './screens/CitizenProfileHubScreen';
import { CitizenPersonalInfoScreen } from './screens/CitizenPersonalInfoScreen';
import { CitizenHouseholdScreen } from './screens/CitizenHouseholdScreen';
import { CitizenDocumentsScreen } from './screens/CitizenDocumentsScreen';

export type UserStackParamList = {
  Profile: undefined;
  EditProfile: { profile?: any } | undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
  CitizenProfileHub: undefined;
  CitizenPersonalInfo: undefined;
  CitizenHousehold: undefined;
  CitizenDocuments: undefined;
};

const Stack = createNativeStackNavigator<UserStackParamList>();

export const UserNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Profile"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
      <Stack.Screen name="CitizenProfileHub" component={CitizenProfileHubScreen} />
      <Stack.Screen name="CitizenPersonalInfo" component={CitizenPersonalInfoScreen} />
      <Stack.Screen name="CitizenHousehold" component={CitizenHouseholdScreen} />
      <Stack.Screen name="CitizenDocuments" component={CitizenDocumentsScreen} />
    </Stack.Navigator>
  );
};
