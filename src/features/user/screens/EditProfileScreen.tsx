import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { CustomInput } from '../../auth/components/CustomInput';
import { userApi, UpdateProfileDto } from '../api/userApi';

export const EditProfileScreen = () => {
  const navigation = useNavigation<any>();
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    setHasInteracted({ fullName: true, phoneNumber: true });
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updateData: UpdateProfileDto = {
        fullName,
        phoneNumber: phoneNumber || undefined,
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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="x" color="#000000" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.formContainer}>
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

          <TouchableOpacity 
            style={[styles.saveBtn, isSaveEnabled && styles.saveBtnActive]}
            disabled={!isSaveEnabled || loading}
            onPress={handleSave}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.saveBtnText, isSaveEnabled && styles.saveBtnTextActive]}>
                Lưu thay đổi
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, paddingHorizontal: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 30,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    borderColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  formContainer: { flex: 1 },
  saveBtn: {
    backgroundColor: '#F2F2F7',
    height: 52,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  saveBtnActive: { backgroundColor: '#000000' },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: '#8E8E93' },
  saveBtnTextActive: { color: '#FFFFFF' },
});