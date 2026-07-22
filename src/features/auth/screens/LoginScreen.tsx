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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RHSColors, spacing, borderRadius, typography } from '../../../lib/theme';
import { authApi } from '../api/authApi';
import { setTokens, getRememberedEmail, saveRememberedEmail } from '../../../lib/tokenStorage';
import { isBiometricEnabled, authenticateWithBiometrics, getStoredBiometricData, updateStoredRefreshToken, disableBiometric, clearBiometricIfEmailMismatched } from '../../../lib/biometricService';

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [rememberMe, setRememberMe] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  // Thêm state để kiểm tra xem máy có đang bật sinh trắc học không để render UI cho phù hợp
  const [hasBiometricEnabled, setHasBiometricEnabled] = useState(false); 

  const navigateToMainTabs = () => {
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  const handleBiometricLogin = async (isAuto = false) => {
    setBiometricLoading(true);
    try {
      const authResult = await authenticateWithBiometrics(
        'Đăng nhập vào Hệ thống dịch vụ công',
      );
      if (!authResult.success) {
        return;
      }

      const storedData = await getStoredBiometricData();
      if (!storedData) {
        Alert.alert(
          'Sinh trắc học',
          'Dữ liệu xác thực không còn hợp lệ. Vui lòng đăng nhập bằng mật khẩu.',
        );
        await disableBiometric();
        setHasBiometricEnabled(false);
        return;
      }

      const refreshResult = await authApi.refreshToken({ refreshToken: storedData.refreshToken });
      if (refreshResult.success && refreshResult.accessToken) {
        await setTokens(refreshResult.accessToken, refreshResult.refreshToken);
        if (refreshResult.refreshToken) {
          await updateStoredRefreshToken(refreshResult.refreshToken);
        }
        navigateToMainTabs();
      } else {
        Alert.alert(
          'Phiên hết hạn',
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập bằng mật khẩu.',
        );
      }
    } catch (error: any) {
      if (!isAuto) {
        Alert.alert('Lỗi', 'Không thể xác thực sinh trắc học. Vui lòng thử lại.');
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const savedEmail = await getRememberedEmail();
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const enabled = await isBiometricEnabled();
      setHasBiometricEnabled(enabled); // Cập nhật state để show/hide nút vân tay
      if (enabled) {
        handleBiometricLogin(true);
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

        await clearBiometricIfEmailMismatched(email.trim());

        if (result.refreshToken) {
          await updateStoredRefreshToken(result.refreshToken);
        }

        const routeParams = navigation.getState()?.routes?.find((r: any) => r.name === 'Login')?.params;
        const returnTo = routeParams?.returnTo;

        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });

        if (returnTo) {
          setTimeout(() => {
            navigation.navigate('MainTabs', { screen: returnTo });
          }, 100);
        }
      } else {
        setErrors({
          email: ' ',
          password: result.message || 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.',
        });
      }
    } catch (error: any) {
      const status = error.response?.status;
      const serverMsg =
        error.response?.data?.message
        || error.response?.data?.title
        || error.message;

      if (status === 400 && String(serverMsg).toLowerCase().includes('otp')) {
        Alert.alert('Chưa xác thực', 'Tài khoản chưa xác thực email. Vui lòng nhập mã OTP.', [
          { text: 'Nhập OTP', onPress: () => navigation.navigate('VerifyOtp', { email: email.trim() }) },
          { text: 'Để sau', style: 'cancel' },
        ]);
      } else if (
        status === 401
        || status === 400
        || String(serverMsg).toLowerCase().includes('password')
        || String(serverMsg).toLowerCase().includes('mật khẩu')
        || String(serverMsg).toLowerCase().includes('invalid')
      ) {
        setErrors({
          email: ' ',
          password: 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.',
        });
      } else {
        setErrors({ password: 'Không thể kết nối đến máy chủ. Vui lòng thử lại.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color="#333" />
          </TouchableOpacity>

          <View style={styles.container}>
            <Text style={styles.title}>Đăng nhập</Text>

            {/* Email */}
            <View style={[styles.inputWrap, !!errors.email && styles.inputError]}>
              <Feather name="user" size={20} color={RHSColors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInputInner}
                value={email}
                onChangeText={(t: string) => { setEmail(t); setErrors(prev => ({ ...prev, email: undefined })); }}
                placeholder="Nhập SĐT chính hoặc email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={RHSColors.textMuted}
              />
            </View>
            {errors.email && errors.email.trim() ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}

            {/* Password */}
            <View style={[styles.inputWrap, !!errors.password && styles.inputError, { marginTop: 16 }]}>
              <Feather name="lock" size={20} color={RHSColors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInputInner}
                value={password}
                onChangeText={(t: string) => { setPassword(t); setErrors(prev => ({ ...prev, password: undefined })); }}
                placeholder="Nhập mật khẩu"
                secureTextEntry={!showPassword}
                placeholderTextColor={RHSColors.textMuted}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={RHSColors.textMuted} />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

            {/* Remember & Forgot */}
            <View style={styles.rowBetween}>
              <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.7}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Feather name="check" size={14} color="#fff" />}
                </View>
                <Text style={styles.rememberText}>Nhớ tài khoản</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotText}>Quên mật khẩu</Text>
              </TouchableOpacity>
            </View>

            {/* --- CỤM NÚT ĐĂNG NHẬP NẰM NGANG --- */}
            <View style={styles.actionButtonsRow}>
              
              {/* Nút Đăng nhập thường (Flex 1 - Giãn dài) */}
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

              {/* Nút Sinh trắc học (Cố định 56x56) - Chỉ hiện khi User đã bật sinh trắc học */}
              {hasBiometricEnabled && (
                <TouchableOpacity
                  style={styles.biometricBtnCircle}
                  onPress={() => handleBiometricLogin(false)}
                  activeOpacity={0.7}
                  disabled={biometricLoading}
                >
                  {biometricLoading ? (
                    <ActivityIndicator color={RHSColors.blue700} size={22} />
                  ) : (
                    <Image source={require('../../../../assets/fingerprint.png')} style={styles.biometricIcon} />
                  )}
                </TouchableOpacity>
              )}
            </View>
            {/* --------------------------------- */}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Bạn chưa có tài khoản?{' '}
                <Text 
                  style={styles.registerLink} 
                  onPress={() => navigation.navigate('Register')}
                >
                  Đăng ký
                </Text>
              </Text>
            </View>
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

  backBtn: {
    marginTop: 12,
    marginLeft: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },

  title: {
    ...typography.h1,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '700',
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 28,
    paddingHorizontal: 18,
    height: 56,
  },
  inputError: { borderColor: RHSColors.error },
  inputIcon: { marginRight: 12 },
  textInputInner: { flex: 1, fontSize: 16, color: RHSColors.text, padding: 0 },
  errorText: { color: RHSColors.error, fontSize: 12, marginTop: 6, marginLeft: 18 },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 24,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#BDBDBD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: { backgroundColor: RHSColors.blue700, borderColor: RHSColors.blue700 },
  rememberText: { ...typography.body, color: '#333', fontWeight: '500' },
  forgotText: { ...typography.body, color: '#D32F2F', fontWeight: '500', textDecorationLine: 'underline' },

  // --- STYLES CHO CỤM NÚT MỚI ---
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // Khoảng cách giữa 2 nút
    width: '100%',
  },
  loginBtn: {
    flex: 1, // Chiếm toàn bộ khoảng trống còn lại
    backgroundColor: '#F0F0F0',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnActive: { backgroundColor: RHSColors.blue700 },
  loginBtnText: { ...typography.button, color: '#9E9E9E', fontSize: 17, fontWeight: '600' },

  biometricBtnCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF', 
    borderWidth: 1.5,
    borderColor: RHSColors.blue700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  // -----------------------------

  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 32,
    flexWrap: 'wrap',
  },
  footerText: { ...typography.body, color: '#333' },
  registerLink: { ...typography.body, color: '#D32F2F', fontWeight: '600' },
});