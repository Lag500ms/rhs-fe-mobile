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
import { RHSColors } from '../../../lib/theme';

import { CustomInput } from '../components/CustomInput';
import { Divider } from '../components/Divider';
import { SocialButton } from '../components/SocialButton';
import { authApi, RegisterDto } from '../api/authApi';

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasInteracted, setHasInteracted] = useState<{ [key: string]: boolean }>({});

  const isRegisterEnabled = email.length > 0 && password.length >= 6 && fullName.length > 0;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!fullName) {
      newErrors.fullName = 'Họ tên là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setHasInteracted({ email: true, password: true, fullName: true });

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const registerData: RegisterDto = {
        email,
        password,
        fullName,
        phoneNumber: phoneNumber || undefined,
        role: 'Applicant',
      };

      const result = await authApi.register(registerData);

      if (result.success) {
        Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực OTP.', [
          { text: 'OK', onPress: () => navigation.navigate('VerifyOtp', { email }) },
        ]);
      } else {
        Alert.alert('Lỗi', result.message || 'Đăng ký thất bại');
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

        <Text style={styles.title}>Đăng ký tài khoản</Text>

        <View style={styles.formContainer}>
          <CustomInput
            iconName="mail"
            placeholder="Nhập email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setHasInteracted({ ...hasInteracted, email: false });
            }}
            errorMessage={hasInteracted.email ? errors.email : undefined}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <CustomInput
            iconName="user"
            placeholder="Nhập họ tên"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              setHasInteracted({ ...hasInteracted, fullName: false });
            }}
            errorMessage={hasInteracted.fullName ? errors.fullName : undefined}
          />

          <CustomInput
            iconName="lock"
            placeholder="Nhập mật khẩu"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setHasInteracted({ ...hasInteracted, password: false });
            }}
            errorMessage={hasInteracted.password ? errors.password : undefined}
          />

          <CustomInput
            iconName="phone"
            placeholder="Nhập số điện thoại (tùy chọn)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={[styles.registerBtn, isRegisterEnabled && styles.registerBtnActive]}
            disabled={!isRegisterEnabled || loading}
            onPress={handleRegister}
          >
            {loading ? (
              <ActivityIndicator color={RHSColors.white} />
            ) : (
              <Text style={[styles.registerBtnText, isRegisterEnabled && styles.registerBtnTextActive]}>
                Đăng ký
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Divider text="Hoặc đăng ký với" />

        <View style={styles.socialContainer}>
          <SocialButton />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Bạn đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Đăng nhập</Text>
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
    fontSize: 28, fontWeight: 'bold', color: RHSColors.text, textAlign: 'center', marginBottom: 40,
  },
  formContainer: { marginBottom: 30 },
  registerBtn: {
    backgroundColor: RHSColors.surface, height: 52, borderRadius: 25, justifyContent: 'center', alignItems: 'center',
  },
  registerBtnActive: { backgroundColor: RHSColors.govBlue },
  registerBtnText: { fontSize: 16, fontWeight: '600', color: RHSColors.textMuted },
  registerBtnTextActive: { color: RHSColors.white },
  socialContainer: { alignItems: 'center', marginBottom: 30 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14, color: RHSColors.text },
  loginText: { fontSize: 14, fontWeight: '600', color: RHSColors.govRed, textDecorationLine: 'underline' },
});