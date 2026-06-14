import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RHSColors } from '../../../lib/theme';

import { CustomInput } from '../../auth/components/CustomInput';
import { userApi, UpdateProfileDto, UserProfileDto } from '../api/userApi';

export const EditProfileScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const existingProfile: UserProfileDto | undefined = route.params?.profile;

  const [fullName, setFullName] = useState(existingProfile?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(existingProfile?.phoneNumber || '');
  const [address, setAddress] = useState(existingProfile?.address || '');
  const [dateOfBirth, setDateOfBirth] = useState(
    existingProfile?.dateOfBirth
      ? existingProfile.dateOfBirth.split('T')[0]
      : ''
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasInteracted, setHasInteracted] = useState<{ [key: string]: boolean }>({});

  const isSaveEnabled = fullName.length >= 2;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!fullName) {
      newErrors.fullName = 'Họ tên là bắt buộc';
    } else if (fullName.length < 2) {
      newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
    }
    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      newErrors.dateOfBirth = 'Ngày sinh phải có định dạng YYYY-MM-DD';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    setHasInteracted({ fullName: true, phoneNumber: true, address: true, dateOfBirth: true });
    if (!validateForm()) return;
    setLoading(true);
    try {
      const updateData: UpdateProfileDto = {
        fullName,
        phoneNumber: phoneNumber || undefined,
        address: address || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
      };
      const result = await userApi.updateProfile(updateData);
      if (result.success) {
        Alert.alert('Thành công', 'Cập nhật thông tin thành công', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Lỗi', result.message || 'Cập nhật thất bại');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.brandBar}>
        <View style={styles.brandBarStripeRed} />
        <View style={styles.brandBarStripeGold} />
        <View style={styles.brandBarStripeBlue} />
      </View>
      <LinearGradient
        colors={[RHSColors.govBlueDark, RHSColors.govBlue, RHSColors.govTeal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="x" color={RHSColors.white} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <CustomInput
              iconName="user"
              placeholder="Họ tên"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                setHasInteracted({ ...hasInteracted, fullName: false });
              }}
              errorMessage={hasInteracted.fullName ? errors.fullName : undefined}
            />

            <CustomInput
              iconName="phone"
              placeholder="Số điện thoại"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <CustomInput
              iconName="map-pin"
              placeholder="Địa chỉ"
              value={address}
              onChangeText={setAddress}
            />

            <CustomInput
              iconName="calendar"
              placeholder="Ngày sinh (YYYY-MM-DD)"
              value={dateOfBirth}
              onChangeText={(text) => {
                setDateOfBirth(text);
                setHasInteracted({ ...hasInteracted, dateOfBirth: false });
              }}
              errorMessage={hasInteracted.dateOfBirth ? errors.dateOfBirth : undefined}
              keyboardType="numbers-and-punctuation"
            />

            <TouchableOpacity
              style={[styles.saveBtn, isSaveEnabled && styles.saveBtnActive]}
              disabled={!isSaveEnabled || loading}
              onPress={handleSave}
            >
              {loading ? (
                <ActivityIndicator color={RHSColors.white} />
              ) : (
                <Text style={[styles.saveBtnText, isSaveEnabled && styles.saveBtnTextActive]}>
                  Lưu thay đổi
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: RHSColors.surface,
  },
  brandBar: {
    flexDirection: 'row',
    height: 4,
  },
  brandBarStripeRed: {
    flex: 2,
    backgroundColor: RHSColors.govRed,
  },
  brandBarStripeGold: {
    flex: 0.4,
    backgroundColor: RHSColors.govGold,
  },
  brandBarStripeBlue: {
    flex: 2,
    backgroundColor: RHSColors.govBlue,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: RHSColors.white,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formCard: {
    backgroundColor: RHSColors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: RHSColors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  saveBtn: {
    backgroundColor: RHSColors.surface,
    height: 52,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnActive: {
    backgroundColor: RHSColors.govBlue,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: RHSColors.textMuted,
  },
  saveBtnTextActive: {
    color: RHSColors.white,
  },
});
