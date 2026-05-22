import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput as RNTextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { CustomInput } from '../components/CustomInput';
import { authApi } from '../api/authApi';

interface ResetPasswordRouteParams {
  email: string;
}

export const ResetPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { email } = route.params as ResetPasswordRouteParams;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasInteracted, setHasInteracted] = useState<{ [key: string]: boolean }>({});
  const inputRefs = useRef<(RNTextInput | null)[]>([]);

  const isSubmitEnabled = otp.join('').length === 6 && newPassword.length >= 6 && confirmPassword.length >= 6;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (otp.join('').length !== 6) {
      newErrors.otp = 'Vui lòng nhập đầy đủ mã OTP';
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

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleResetPassword = async () => {
    setHasInteracted({ otp: true, newPassword: true, confirmPassword: true });
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.resetPassword({
        email,
        otpCode: otp.join(''),
        newPassword,
        confirmPassword,
      });

      if (result.success) {
        Alert.alert('Thành công', 'Đặt lại mật khẩu thành công!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('Lỗi', result.message || 'Đặt lại mật khẩu thất bại');
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

        <Text style={styles.title}>Đặt lại mật khẩu</Text>
        <Text style={styles.subtitle}>Nhập mã OTP và mật khẩu mới cho {email}</Text>

        <View style={styles.formContainer}>
          <Text style={styles.otpLabel}>Mã OTP</Text>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <RNTextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>
          {hasInteracted.otp && errors.otp ? (
            <Text style={styles.errorText}>{errors.otp}</Text>
          ) : null}

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
            placeholder="Xác nhận mật khẩu"
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
            onPress={handleResetPassword}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.submitBtnText, isSubmitEnabled && styles.submitBtnTextActive]}>
                Đặt lại mật khẩu
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
    fontSize: 28, fontWeight: 'bold', color: '#000000', textAlign: 'center', marginBottom: 12,
  },
  subtitle: {
    fontSize: 14, color: '#666666', textAlign: 'center', marginBottom: 40,
  },
  formContainer: { marginBottom: 30 },
  otpLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  otpInputFilled: {
    borderColor: '#000000',
    backgroundColor: '#F8F8F8',
  },
  errorText: {
    color: '#D93843',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#F2F2F7',
    height: 52,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnActive: { backgroundColor: '#000000' },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#8E8E93' },
  submitBtnTextActive: { color: '#FFFFFF' },
});