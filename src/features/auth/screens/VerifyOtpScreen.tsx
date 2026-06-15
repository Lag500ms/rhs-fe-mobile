import React, { useState, useRef } from 'react';
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
import { RHSColors, borderRadius, shadows, typography } from '../../../lib/theme';
import { RHSLogo } from '../../../lib/Logo';
import { authApi } from '../api/authApi';
import { AuthStackParamList } from '../AuthNavigator';

type VerifyOtpRouteProp = RouteProp<AuthStackParamList, 'VerifyOtp'>;

const OTP_LENGTH = 6;

export const VerifyOtpScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<VerifyOtpRouteProp>();
  const email = route.params?.email || '';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  const otpCode = digits.join('');

  const focusDigit = (index: number) => {
    if (index >= 0 && index < OTP_LENGTH) {
      inputRefs.current[index]?.focus();
    }
  };

  const handleDigitChange = (text: string, index: number) => {
    setError('');
    const newDigits = [...digits];

    // Paste: nếu người dùng dán chuỗi dài
    if (text.length >= OTP_LENGTH) {
      const pasted = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH).split('');
      const filled = [...pasted, ...Array(OTP_LENGTH - pasted.length).fill('')].slice(0, OTP_LENGTH);
      setDigits(filled);
      focusDigit(Math.min(pasted.length, OTP_LENGTH - 1));
      return;
    }

    // Nhập từng số
    newDigits[index] = text.replace(/[^0-9]/g, '').slice(-1);
    setDigits(newDigits);

    if (text && index < OTP_LENGTH - 1) {
      focusDigit(index + 1);
    }
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
        Alert.alert('Thành công', 'Xác thực OTP thành công!', [
          { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) },
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
    setResending(true);
    setError('');
    try {
      const result = await authApi.resendOtp(email);
      if (result.success) {
        Alert.alert('Thành công', 'Mã OTP mới đã được gửi đến email của bạn');
        // Xóa ô cũ
        setDigits(Array(OTP_LENGTH).fill(''));
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
      {/* Brand bar */}
      <View style={styles.brandBar}>
        <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.red600 }]} />
        <View style={[styles.stripe, { flex: 0.4, backgroundColor: RHSColors.amber600 }]} />
        <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.blue700 }]} />
      </View>

      {/* Compact header */}
      <LinearGradient
        colors={['#0A3A85', '#1565C0', '#1E88E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBg}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <RHSLogo size={36} />
        <Text style={styles.headerTitle}>Xác thực OTP</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
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
                maxLength={1}
                selectTextOnFocus
                caretHidden
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

          {/* Verify button */}
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
          <TouchableOpacity style={styles.resendBtn} onPress={handleResendOtp} disabled={resending}>
            {resending ? (
              <ActivityIndicator size="small" color={RHSColors.blue700} />
            ) : (
              <Text style={styles.resendText}>Gửi lại mã OTP</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: RHSColors.surface },
  brandBar: { flexDirection: 'row', height: 4 },
  stripe: { height: '100%' },
  headerBg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 40 },

  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: RHSColors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: RHSColors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: RHSColors.textMuted,
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 20,
  },

  otpRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: RHSColors.border,
    backgroundColor: '#fff',
    fontSize: 24,
    fontWeight: '800',
    color: RHSColors.text,
    textAlign: 'center',
    ...shadows.sm,
  },
  otpBoxFilled: {
    borderColor: RHSColors.blue700,
    backgroundColor: RHSColors.blue50,
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
    borderRadius: borderRadius.lg,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    ...shadows.sm,
  },
  verifyBtnActive: { backgroundColor: RHSColors.blue700, ...shadows.md },
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
});