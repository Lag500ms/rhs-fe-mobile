import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { RHSColors, borderRadius, typography } from '../../../lib/theme';
import { RHSLogo } from '../../../lib/Logo';
import { authApi } from '../api/authApi';
import { setTokens } from '../../../lib/tokenStorage';
import { AuthStackParamList } from '../AuthNavigator';

type VerifyOtpRouteProp = RouteProp<AuthStackParamList, 'VerifyOtp'>;

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 60;

export const VerifyOtpScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<VerifyOtpRouteProp>();
  const email = route.params?.email || '';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  const otpCode = digits.join('');

  // Bộ đếm ngược cho nút gửi lại mã
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const focusDigit = (index: number) => {
    if (index >= 0 && index < OTP_LENGTH) {
      inputRefs.current[index]?.focus();
    }
  };

  const handleDigitChange = (text: string, index: number) => {
    setError('');
    const cleaned = text.replace(/\D/g, '');

    // Xóa ô
    if (!cleaned) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    // Paste / autofill: maxLength phải > 1 thì mới nhận đủ chuỗi
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, OTP_LENGTH).split('');
      // Dán đủ 6 số → ghi đè toàn bộ; dán một phần → điền từ ô hiện tại
      if (chars.length >= OTP_LENGTH) {
        setDigits(chars.slice(0, OTP_LENGTH));
        focusDigit(OTP_LENGTH - 1);
      } else {
        const next = [...digits];
        chars.forEach((ch, i) => {
          if (index + i < OTP_LENGTH) next[index + i] = ch;
        });
        setDigits(next);
        focusDigit(Math.min(index + chars.length, OTP_LENGTH - 1));
      }
      return;
    }

    // Nhập từng số
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (index < OTP_LENGTH - 1) focusDigit(index + 1);
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      focusDigit(index - 1);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < OTP_LENGTH) {
      setError('Vui lòng nhập đầy đủ mã OTP 6 chữ số');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await authApi.verifyOtp({ email, otpCode });

      if (result.success) {
        // Lưu token nếu backend trả về để đăng nhập luôn sau khi kích hoạt
        if (result.accessToken) {
          await setTokens(result.accessToken, result.refreshToken);
        }
        Alert.alert('Thành công', 'Kích hoạt tài khoản thành công!', [
          {
            text: 'OK',
            onPress: () =>
              navigation.reset({ index: 0, routes: [{ name: 'UserProfile' }] }),
          },
        ]);
      } else {
        setError(result.message || 'Xác thực OTP thất bại');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      const result = await authApi.resendOtp(email);
      if (result.success) {
        Alert.alert('Thành công', 'Mã OTP mới đã được gửi đến email của bạn');
        // Xóa ô cũ và bắt đầu lại bộ đếm 60 giây
        setDigits(Array(OTP_LENGTH).fill(''));
        setCountdown(RESEND_COUNTDOWN);
        focusDigit(0);
      } else {
        setError(result.message || 'Gửi lại OTP thất bại');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Split Screen: gradient top with logo */}
      <LinearGradient
        colors={['#0A3A85', '#1565C0', '#1E88E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topGradient}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <RHSLogo size={48} />
        <Text style={styles.brandTitle}>Xác thực OTP</Text>
        <Text style={styles.brandSubtitle}>Nhập mã xác thực được gửi đến email</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* White card overlapping */}
          <View style={styles.card}>
            {/* Icon */}
            <View style={styles.iconCircle}>
              <Feather name="mail" size={40} color={RHSColors.blue700} />
            </View>

            <Text style={styles.title}>Nhập mã xác thực</Text>
            <Text style={styles.subtitle}>
              Mã OTP 6 chữ số đã được gửi đến{' '}
              <Text style={{ fontWeight: '700', color: RHSColors.blue700 }}>{email}</Text>
            </Text>

            {/* OTP digit boxes */}
            <View style={styles.otpRow}>
              {digits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.otpBox,
                    digit ? styles.otpBoxFilled : null,
                    error ? styles.otpBoxError : null,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleDigitChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  // maxLength=1 chặn paste — để OTP_LENGTH để nhận đủ chuỗi khi copy/paste
                  maxLength={OTP_LENGTH}
                  selectTextOnFocus
                  caretHidden
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  importantForAutofill="yes"
                  placeholderTextColor={RHSColors.textMuted}
                />
              ))}
            </View>

            {/* Error message */}
            {error ? (
              <View style={styles.errorWrap}>
                <Feather name="alert-circle" size={14} color={RHSColors.red600} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Verify button - BLUE */}
            <TouchableOpacity
              style={[styles.verifyBtn, otpCode.length === OTP_LENGTH && styles.verifyBtnActive]}
              disabled={otpCode.length < OTP_LENGTH || loading}
              onPress={handleVerifyOtp}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size={22} />
              ) : (
                <Text
                  style={[styles.verifyBtnText, otpCode.length === OTP_LENGTH && { color: '#fff' }]}
                >
                  Xác thực
                </Text>
              )}
            </TouchableOpacity>

            {/* Resend button */}
            <TouchableOpacity
              style={styles.resendBtn}
              onPress={handleResendOtp}
              disabled={resending || countdown > 0}
            >
              {resending ? (
                <ActivityIndicator size="small" color={RHSColors.blue700} />
              ) : countdown > 0 ? (
                <Text style={styles.resendTextDisabled}>
                  Gửi lại mã OTP sau {countdown}s
                </Text>
              ) : (
                <Text style={styles.resendText}>Gửi lại mã OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },

  // Split screen gradient top
  topGradient: {
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backBtn: {
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
  brandTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.5, marginTop: 8 },
  brandSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 4 },

  // White card
  card: {
    backgroundColor: '#fff',
    marginTop: -24,
    borderRadius: borderRadius.xxl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RHSColors.border,
  },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: RHSColors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: RHSColors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: RHSColors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },

  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
    fontSize: 24,
    fontWeight: '800',
    color: RHSColors.text,
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: RHSColors.blue700,
    backgroundColor: '#E3F2FD',
    shadowColor: RHSColors.blue700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  otpBoxError: {
    borderColor: RHSColors.red600,
    backgroundColor: '#FFF5F5',
  },

  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF0F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: RHSColors.red600,
    flex: 1,
  },

  verifyBtn: {
    backgroundColor: RHSColors.grey300,
    borderRadius: borderRadius.md,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  verifyBtnActive: { backgroundColor: RHSColors.blue700 },
  verifyBtnText: { ...typography.button, color: RHSColors.textMuted, letterSpacing: 0.5 },

  resendBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: RHSColors.blue700,
    textDecorationLine: 'underline',
  },
  resendTextDisabled: {
    fontSize: 14,
    fontWeight: '600',
    color: RHSColors.textMuted,
  },
});