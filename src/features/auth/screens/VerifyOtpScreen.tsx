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
import { appAlert } from '../../../lib/appDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { RHSColors, borderRadius, typography } from '../../../lib/theme';
import { RHSLogo } from '../../../lib/Logo';
import { OtpInput } from '../../../components/OtpInput';
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

  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerifyOtp = async () => {
    if (otpCode.length < OTP_LENGTH) {
      setError('Vui lòng nhập đầy đủ mã xác thực 6 chữ số');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await authApi.verifyOtp({ email, otpCode });

      if (result.success) {
        if (result.accessToken) {
          await setTokens(result.accessToken, result.refreshToken);
        }
        appAlert('Thành công', 'Kích hoạt tài khoản thành công!', [
          {
            text: 'Đồng ý',
            onPress: () => {
              navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
              setTimeout(() => {
                navigation.navigate('UserProfile');
              }, 100);
            },
          },
        ]);
      } else {
        setError(result.message || 'Xác thực thất bại');
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
        appAlert('Thành công', 'Mã xác thực mới đã được gửi đến email của bạn');
        setOtpCode('');
        setCountdown(RESEND_COUNTDOWN);
      } else {
        setError(result.message || 'Gửi lại mã thất bại');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
        <Text style={styles.brandTitle}>Xác thực email</Text>
        <Text style={styles.brandSubtitle}>Nhập mã xác thực được gửi đến email</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Feather name="mail" size={40} color={RHSColors.blue700} />
            </View>

            <Text style={styles.title}>Nhập mã xác thực</Text>
            <Text style={styles.subtitle}>
              Mã xác thực 6 chữ số đã được gửi đến{' '}
              <Text style={{ fontWeight: '700', color: RHSColors.blue700 }}>{email}</Text>
            </Text>

            <OtpInput
              value={otpCode}
              onChange={(code) => {
                setError('');
                setOtpCode(code);
              }}
              error={!!error}
              autoFocus
            />

            {error ? (
              <View style={styles.errorWrap}>
                <Feather name="alert-circle" size={14} color={RHSColors.red600} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

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

            <TouchableOpacity
              style={styles.resendBtn}
              onPress={handleResendOtp}
              disabled={resending || countdown > 0}
            >
              {resending ? (
                <ActivityIndicator size="small" color={RHSColors.blue700} />
              ) : countdown > 0 ? (
                <Text style={styles.resendTextDisabled}>
                  Gửi lại mã sau {countdown}s
                </Text>
              ) : (
                <Text style={styles.resendText}>Gửi lại mã xác thực</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },

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
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 },

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
    marginBottom: 24,
    lineHeight: 20,
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
    marginTop: 12,
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
