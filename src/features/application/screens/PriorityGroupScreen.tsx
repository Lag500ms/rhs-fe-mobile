import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RHSColors } from '../../../lib/theme';

/**
 * Màn cũ bước 2 — đối tượng đã gộp vào bước 1 (BasicInformation).
 * Giữ route để stack cũ / HMR không vỡ, chuyển thẳng về xác nhận hồ sơ.
 */
export const PriorityGroupScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  useEffect(() => {
    navigation.replace('BasicInformation', {
      projectId: route.params?.projectId,
      projectName: route.params?.projectName,
    });
  }, [navigation, route.params?.projectId, route.params?.projectName]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: RHSColors.surface }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={RHSColors.blue700} />
      </View>
    </SafeAreaView>
  );
};
