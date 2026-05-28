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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { CustomInput } from '../../auth/components/CustomInput';
import { authApi } from '../../auth/api/authApi';

export const ChangePasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasInteracted, setHasInteracted] = useState<{ [key: string]: boolean }>({});

  const isSubmitEnabled = currentPassword.length > 0 && newPassword.length >= 6 && confirmPassword.length >= 6;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!currentPassword) {
      newErrors.currentPassword = 'Mật khẩu hiện tại là bắt buộc';
    }

    if (!newPassword) {
      newErrors.newPassword = 'Mật khẩu mới là bắt buộc';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    setHasInteracted({ currentPassword: true, newPassword: true, confirmPassword: true });
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (result.success) {
        Alert.alert('Thành công', 'Đổi mật khẩu thành công!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Lỗi', result.message || 'Đổi mật khẩu thất bại');
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
            <Feather name="arrow-left" color="#000000" size={24} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Đổi mật khẩu</Text>

        <View style={styles.formContainer}>
          <CustomInput
            iconName="lock"
            placeholder="Mật khẩu hiện tại"
            secureTextEntry
            value={currentPassword}
            onChangeText={(text) => {
              setCurrentPassword(text);
              setHasInteracted({ ...hasInteracted, currentPassword: false });
            }}
            errorMessage={hasInteracted.currentPassword ? errors.currentPassword : undefined}
          />

          <CustomInput
            iconName="lock"
            placeholder="Mật khẩu mới"
            secureTextEntry
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setHasInteracted({ ...hasInteracted, newPassword: false });
            }}
            errorMessage={hasInteracted.newPassword ? errors.newPassword : undefined}
          />

          <CustomInput
            iconName="lock"
            placeholder="Xác nhận mật khẩu mới"
            secureTextEntry
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setHasInteracted({ ...hasInteracted, confirmPassword: false });
            }}
            errorMessage={hasInteracted.confirmPassword ? errors.confirmPassword : undefined}
          />

          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitEnabled && styles.submitBtnActive]}
            disabled={!isSubmitEnabled || loading}
            onPress={handleChangePassword}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.submitBtnText, isSubmitEnabled && styles.submitBtnTextActive]}>
                Đổi mật khẩu
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
  header: { marginTop: 16, marginBottom: 40 },
  backButton: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    borderColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center',
  },
  title: {
    fontSize: 28, fontWeight: 'bold', color: '#000000', textAlign: 'center', marginBottom: 40,
  },
  formContainer: { marginBottom: 30 },
  submitBtn: {
    backgroundColor: '#F2F2F7',
    height: 52,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnActive: { backgroundColor: '#000000' },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#8E8E93' },
  submitBtnTextActive: { color: '#FFFFFF' },
});