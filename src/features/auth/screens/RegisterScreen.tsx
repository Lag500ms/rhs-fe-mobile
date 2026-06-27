import React, { useState } from 'react';
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
import { RHSColors, spacing, borderRadius, typography } from '../../../lib/theme';
import { authApi, RegisterDto } from '../api/authApi';

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isFormValid = email.trim().length > 0 && password.length >= 6 && fullName.trim().length > 0;

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};
    if (!email.trim()) errs.email = 'Vui lòng nhập email';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Email không đúng định dạng';
    if (!fullName.trim()) errs.fullName = 'Vui lòng nhập họ tên';
    if (!password) errs.password = 'Vui lòng nhập mật khẩu';
    else if (password.length < 6) errs.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (phoneNumber && !/^0\d{9}$/.test(phoneNumber)) errs.phoneNumber = 'Số điện thoại không hợp lệ (VD: 0912345678)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const registerData: RegisterDto = {
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber || undefined,
        role: 'Applicant',
      };

      const result = await authApi.register(registerData);

      if (result.success) {
        Alert.alert(
          'Đăng ký thành công!',
          'Vui lòng kiểm tra email để nhận mã xác thực OTP.',
          [{ text: 'Nhập OTP', onPress: () => navigation.navigate('VerifyOtp', { email: email.trim() }) }]
        );
      } else {
        Alert.alert('Đăng ký thất bại', result.message || 'Vui lòng thử lại sau.');
      }
    } catch (error: any) {
      const status = error.response?.status;
      const serverMsg = error.response?.data?.message || error.response?.data?.title;
      const networkMsg = error.message;
      const msg = serverMsg || (status ? `Lỗi kết nối (${status})` : networkMsg) || 'Không thể kết nối đến máy chủ';
      Alert.alert('Đăng ký thất bại', msg);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: string) => setErrors(prev => {
    const next = { ...prev };
    delete next[field];
    return next;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color="#333" />
          </TouchableOpacity>

          <View style={styles.container}>
            <Text style={styles.title}>Đăng ký tài khoản</Text>

            {/* Full name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Họ và tên <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrap, errors.fullName && styles.inputError]}>
                <Feather name="user" size={18} color={RHSColors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInputInner}
                  value={fullName}
                  onChangeText={(t) => { setFullName(t); clearError('fullName'); }}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor={RHSColors.textMuted}
                />
              </View>
              {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrap, errors.email && styles.inputError]}>
                <Feather name="mail" size={18} color={RHSColors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInputInner}
                  value={email}
                  onChangeText={(t) => { setEmail(t); clearError('email'); }}
                  placeholder="Nhập email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={RHSColors.textMuted}
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mật khẩu <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrap, errors.password && styles.inputError]}>
                <Feather name="lock" size={18} color={RHSColors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInputInner}
                  value={password}
                  onChangeText={(t) => { setPassword(t); clearError('password'); }}
                  placeholder="Tối thiểu 6 ký tự"
                  secureTextEntry={!showPassword}
                  placeholderTextColor={RHSColors.textMuted}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={RHSColors.textMuted} />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {/* Phone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Số điện thoại</Text>
              <View style={[styles.inputWrap, errors.phoneNumber && styles.inputError]}>
                <Feather name="phone" size={18} color={RHSColors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInputInner}
                  value={phoneNumber}
                  onChangeText={(t) => { setPhoneNumber(t); clearError('phoneNumber'); }}
                  placeholder="0912345678 (không bắt buộc)"
                  keyboardType="phone-pad"
                  placeholderTextColor={RHSColors.textMuted}
                />
              </View>
              {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}
            </View>

            {/* Register button */}
            <TouchableOpacity
              style={[styles.registerBtn, isFormValid && styles.registerBtnActive]}
              disabled={!isFormValid || loading}
              onPress={handleRegister}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size={22} />
              ) : (
                <Text style={[styles.registerBtnText, isFormValid && { color: '#fff' }]}>Đăng ký</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.note}>
              Bằng việc đăng ký, bạn đồng ý với{' '}
              <Text style={styles.link}>Điều khoản sử dụng</Text> và{' '}
              <Text style={styles.link}>Chính sách bảo mật</Text> của chúng tôi.
            </Text>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Bạn đã có tài khoản?{' '}
                <Text 
                  style={styles.loginLink} 
                  onPress={() => navigation.navigate('Login')}
                >
                  Đăng nhập
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
    paddingTop: 24,
  },

  title: {
    ...typography.h1,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '700',
  },

  fieldGroup: { 
    marginBottom: 16 
  },
  label: { 
    ...typography.caption, 
    color: RHSColors.textSecondary, 
    marginBottom: 8, 
    fontWeight: '600' 
  },
  required: { 
    color: RHSColors.error 
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
  textInputInner: { flex: 1, fontSize: 16, color: RHSColors.text, padding: 0 },
  inputIcon: { marginRight: 12 },
  errorText: { color: RHSColors.error, fontSize: 12, marginTop: 6, marginLeft: 18 },

  registerBtn: {
    backgroundColor: '#F0F0F0',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  registerBtnActive: { backgroundColor: RHSColors.blue700 },
  registerBtnText: { ...typography.button, color: '#9E9E9E', fontSize: 17, fontWeight: '600' },

  note: {
    ...typography.caption,
    color: RHSColors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  link: { color: RHSColors.blue700, fontWeight: '600' },

  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 32,
    flexWrap: 'wrap'
  },
  footerText: { ...typography.body, color: '#333' },
  loginLink: { ...typography.body, color: '#D32F2F', fontWeight: '600' },
});