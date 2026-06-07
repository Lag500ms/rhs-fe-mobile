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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RHSColors } from '../../../lib/theme';

import { CustomInput } from '../components/CustomInput';
import { authApi } from '../api/authApi';
import { AuthStackParamList } from '../AuthNavigator';

type ResetPasswordRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ResetPasswordRouteProp>();
  const email = route.params?.email || '';

  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasInteracted, setHasInteracted] = useState<{ [key: string]: boolean }>({});

  const isSubmitEnabled = otpCode.length > 0 && newPassword.length >= 6 && confirmPassword.length >= 6;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!otpCode) {
      newErrors.otpCode = 'Mã OTP là bắt buộc';
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

  const handleResetPassword = async () => {
    setHasInteracted({ otpCode: true, newPassword: true, confirmPassword: true });

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.resetPassword({
        email,
        otpCode,
        newPassword,
        confirmPassword,
      });

      if (result.success) {
        Alert.alert('Thành công', 'Mật khẩu đã được đặt lại thành công', [
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
      <View style={styles.brandBar}>
        <View style={styles.brandBarStripeRed} />
        <View style={styles.brandBarStripeGold} />
        <View style={styles.brandBarStripeBlue} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" color={RHSColors.text} size={24} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Đặt lại mật khẩu</Text>
        <Text style={styles.subtitle}>
          Nhập mã OTP và mật khẩu mới để đặt lại mật khẩu
        </Text>

        <View style={styles.formContainer}>
          <CustomInput
            iconName="key"
            placeholder="Nhập mã OTP"
            value={otpCode}
            onChangeText={(text) => {
              setOtpCode(text);
              setHasInteracted({ ...hasInteracted, otpCode: false });
            }}
            errorMessage={hasInteracted.otpCode ? errors.otpCode : undefined}
            keyboardType="number-pad"
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
              <ActivityIndicator color={RHSColors.white} />
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
  safeArea: { flex: 1, backgroundColor: RHSColors.surfaceCard },
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
  container: { flex: 1, paddingHorizontal: 24 },
  header: { marginTop: 16, marginBottom: 40 },
  backButton: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    borderColor: RHSColors.border, justifyContent: 'center', alignItems: 'center',
  },
  title: {
    fontSize: 28, fontWeight: 'bold', color: RHSColors.text, textAlign: 'center', marginBottom: 12,
  },
  subtitle: {
    fontSize: 14, color: RHSColors.textMuted, textAlign: 'center', marginBottom: 40, lineHeight: 20,
  },
  formContainer: { marginBottom: 30 },
  submitBtn: {
    backgroundColor: RHSColors.surface,
    height: 52,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnActive: { backgroundColor: RHSColors.govBlue },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: RHSColors.textMuted },
  submitBtnTextActive: { color: RHSColors.white },
});