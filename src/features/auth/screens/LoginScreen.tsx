import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { RHSColors, spacing, borderRadius, typography } from '../../../lib/theme';
import { RHSLogo } from '../../../lib/Logo';
import { authApi } from '../api/authApi';
import { setTokens, getRememberedEmail, saveRememberedEmail } from '../../../lib/tokenStorage';

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
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

  const isFormValid = email.trim().length > 0 && password.length > 0;

  const validate = (): boolean => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) errs.email = 'Vui lòng nhập email';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Email không đúng định dạng';
    if (!password) errs.password = 'Vui lòng nhập mật khẩu';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const result = await authApi.login({ email: email.trim(), password });

      if (result.success && result.accessToken) {
        await setTokens(result.accessToken, result.refreshToken);
        if (rememberMe) await saveRememberedEmail(email.trim());
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } else {
        setErrors({ password: result.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.' });
      }
    } catch (error: any) {
      const status = error.response?.status;
      const serverMsg = error.response?.data?.message || error.response?.data?.title;

      if (status === 401 || serverMsg?.toLowerCase().includes('password') || serverMsg?.toLowerCase().includes('mật khẩu')) {
        setErrors({ password: 'Mật khẩu hoặc email không đúng' });
      } else if (status === 400 && serverMsg?.toLowerCase().includes('otp')) {
        Alert.alert('Chưa xác thực', 'Tài khoản chưa xác thực email. Vui lòng nhập mã OTP.', [
          { text: 'Nhập OTP', onPress: () => navigation.navigate('VerifyOtp', { email: email.trim() }) },
          { text: 'Để sau', style: 'cancel' },
        ]);
      } else {
        setErrors({ password: 'Không thể kết nối đến máy chủ. Vui lòng thử lại.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Split Screen: 30% gradient top with logo */}
      <LinearGradient
        colors={['#0A3A85', '#1565C0', '#1E88E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topGradient}
      >
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Feather name="x" size={22} color="#fff" />
        </TouchableOpacity>
        <RHSLogo size={48} />
        <Text style={styles.brandTitle}>RHS Platform</Text>
        <Text style={styles.brandSubtitle}>Cổng thông tin nhà ở xã hội</Text>
      </LinearGradient>

      {/* Bottom white card with form */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.welcome}>Chào mừng bạn!</Text>
            <Text style={styles.subtitle}>Đăng nhập để tra cứu nhà ở và đăng ký</Text>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputWrap, errors.email && styles.inputError]}>
                <Feather name="mail" size={18} color={RHSColors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInputInner}
                  value={email}
                  onChangeText={(t: string) => { setEmail(t); setErrors(prev => ({ ...prev, email: undefined })); }}
                  placeholder="Nhập email của bạn"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={RHSColors.textMuted}
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={[styles.inputWrap, errors.password && styles.inputError]}>
                <Feather name="lock" size={18} color={RHSColors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInputInner}
                  value={password}
                  onChangeText={(t: string) => { setPassword(t); setErrors(prev => ({ ...prev, password: undefined })); }}
                  placeholder="Nhập mật khẩu"
                  secureTextEntry={!showPassword}
                  placeholderTextColor={RHSColors.textMuted}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={RHSColors.textMuted} />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={[styles.errorText, { color: RHSColors.red600, fontWeight: '600', fontSize: 13, textAlign: 'center', marginTop: 10, backgroundColor: '#FFF0F0', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, overflow: 'hidden' }]}>{errors.password}</Text> : null}
            </View>

            {/* Remember me */}
            <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.7}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Feather name="check" size={14} color="#fff" />}
              </View>
              <Text style={styles.rememberText}>Ghi nhớ tài khoản</Text>
            </TouchableOpacity>

            {/* Login button - BLUE primary */}
            <TouchableOpacity
              style={[styles.loginBtn, isFormValid && styles.loginBtnActive]}
              disabled={!isFormValid || loading}
              onPress={handleLogin}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size={22} />
              ) : (
                <Text style={[styles.loginBtnText, isFormValid && { color: '#fff' }]}>Đăng nhập</Text>
              )}
            </TouchableOpacity>

            {/* Forgot password */}
            <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Bạn chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  // Split screen: 30% gradient top
  topGradient: {
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 1, marginTop: 8 },
  brandSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  // White card overlapping bottom
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -24,
    borderRadius: borderRadius.xxl,
    padding: 24,
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  welcome: { ...typography.h2, color: RHSColors.text, marginBottom: 4 },
  subtitle: { ...typography.bodySmall, color: RHSColors.textSecondary, marginBottom: 24 },
  fieldGroup: { marginBottom: 16 },
  label: { ...typography.caption, color: RHSColors.textSecondary, marginBottom: 6, fontWeight: '600' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.grey50,
    borderWidth: 1.5,
    borderColor: RHSColors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    height: 50,
  },
  inputError: { borderColor: RHSColors.error },
  textInputInner: { flex: 1, fontSize: 15, color: RHSColors.text, padding: 0 },
  inputIcon: { marginRight: 10 },
  errorText: { color: RHSColors.error, fontSize: 12, marginTop: 4, marginLeft: 4 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: RHSColors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: { backgroundColor: RHSColors.blue700, borderColor: RHSColors.blue700 },
  rememberText: { ...typography.bodySmall, color: RHSColors.textSecondary },
  loginBtn: {
    backgroundColor: RHSColors.grey300,
    borderRadius: borderRadius.md,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginBtnActive: { backgroundColor: RHSColors.blue700 },
  loginBtnText: { ...typography.button, color: RHSColors.white, letterSpacing: 0.5 },
  forgotBtn: { alignItems: 'center' },
  forgotText: { ...typography.bodySmall, color: RHSColors.blue700, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { ...typography.bodySmall, color: RHSColors.textSecondary },
  registerLink: { ...typography.bodySmall, color: RHSColors.blue700, fontWeight: '700', textDecorationLine: 'underline' },
});