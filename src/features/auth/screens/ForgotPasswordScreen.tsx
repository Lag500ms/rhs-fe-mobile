import React, { useState } from 'react';
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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { CustomInput } from '../components/CustomInput';
import { authApi } from '../api/authApi';

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasInteracted, setHasInteracted] = useState(false);

  const isSubmitEnabled = email.length > 0;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async () => {
    setHasInteracted(true);
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.forgotPassword({ email });

      if (result.success) {
        Alert.alert('Thành công', 'Mã OTP đã được gửi đến email của bạn', [
          { text: 'OK', onPress: () => navigation.navigate('ResetPassword', { email }) },
        ]);
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể gửi mã OTP');
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

        <Text style={styles.title}>Quên mật khẩu</Text>
        <Text style={styles.subtitle}>Nhập email để nhận mã OTP đặt lại mật khẩu</Text>

        <View style={styles.formContainer}>
          <CustomInput
            iconName="mail"
            placeholder="Nhập email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setHasInteracted(false);
            }}
            errorMessage={hasInteracted ? errors.email : undefined}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitEnabled && styles.submitBtnActive]}
            disabled={!isSubmitEnabled || loading}
            onPress={handleForgotPassword}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.submitBtnText, isSubmitEnabled && styles.submitBtnTextActive]}>
                Gửi mã OTP
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