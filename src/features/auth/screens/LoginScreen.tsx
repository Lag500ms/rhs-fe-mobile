import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RHSColors } from '../../../lib/theme';
import { RHSLogo } from '../../../lib/Logo';

import { CustomInput } from '../components/CustomInput';
import { Divider } from '../components/Divider';
import { SocialButton } from '../components/SocialButton';
import { authApi } from '../api/authApi';
import { setTokens, getRememberedEmail, saveRememberedEmail } from '../../../lib/tokenStorage';

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasInteracted, setHasInteracted] = useState<{ [key: string]: boolean }>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    (async () => {
      const savedEmail = await getRememberedEmail();
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    })();
  }, []);

  const isLoginEnabled = email.length > 0 && password.length > 0;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setHasInteracted({ email: true, password: true });

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.login({ email, password });

      if (result.success && result.accessToken) {
        await setTokens(result.accessToken, result.refreshToken);
        if (rememberMe) {
          await saveRememberedEmail(email);
        }
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          navigation.goBack();
        }, 1000);
      } else {
        setShowSuccess(false);
      }
    } catch (error: any) {
      setShowSuccess(false);
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
              <Feather name="x" color={RHSColors.text} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.logoContainer}>
            <RHSLogo size={64} />
            <Text style={styles.appNameText}>Hệ thống cung ứng{'\n'}nhà ở xã hội bền vững</Text>
          </View>

          <Text style={styles.title}>Đăng nhập</Text>

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

            <TouchableOpacity
              style={styles.rememberContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe && <Feather name="check" color={RHSColors.white} size={16} />}
              </View>
              <Text style={styles.rememberText}>Lưu tài khoản</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, isLoginEnabled && styles.loginBtnActive]}
              disabled={!isLoginEnabled || loading}
              onPress={handleLogin}
            >
              {loading ? (
                <ActivityIndicator color={RHSColors.white} />
              ) : (
                <Text style={[styles.loginBtnText, isLoginEnabled && styles.loginBtnTextActive]}>
                  Đăng nhập
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          <Divider text="Hoặc đăng nhập với" />

          <View style={styles.socialContainer}>
            <SocialButton />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Bạn chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>Đăng ký</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContainer: { flexGrow: 1 },
  header: { marginTop: 16, marginBottom: 20 },
  closeButton: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    borderColor: RHSColors.border, justifyContent: 'center', alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: RHSColors.govBlueDark,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  title: {
    fontSize: 28, fontWeight: 'bold', color: RHSColors.text, textAlign: 'center', marginBottom: 32,
  },
  formContainer: { marginBottom: 30 },
  loginBtn: {
    backgroundColor: RHSColors.surface, height: 52, borderRadius: 25, justifyContent: 'center', alignItems: 'center',
  },
  loginBtnActive: { backgroundColor: RHSColors.govBlue },
  loginBtnText: { fontSize: 16, fontWeight: '600', color: RHSColors.textMuted },
  loginBtnTextActive: { color: RHSColors.white },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: RHSColors.govRed,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: RHSColors.govRed,
  },
  rememberText: {
    fontSize: 14,
    color: RHSColors.text,
  },
  forgotText: {
    fontSize: 14, color: RHSColors.govRed, textAlign: 'center', marginTop: 16,
    textDecorationLine: 'underline',
  },
  socialContainer: { alignItems: 'center', marginBottom: 30 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  footerText: { fontSize: 14, color: RHSColors.text },
  registerText: { fontSize: 14, fontWeight: '600', color: RHSColors.govRed, textDecorationLine: 'underline' },
});