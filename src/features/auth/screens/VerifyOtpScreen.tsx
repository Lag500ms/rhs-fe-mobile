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
import { RHSColors } from '../../../lib/theme';
import { authApi } from '../api/authApi';
import { AuthStackParamList } from '../AuthNavigator';

type VerifyOtpRouteProp = RouteProp<AuthStackParamList, 'VerifyOtp'>;

export const VerifyOtpScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<VerifyOtpRouteProp>();
  const email = route.params?.email || '';

  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.verifyOtp({ email, otpCode });

      if (result.success) {
        Alert.alert('Thành công', 'Xác thực OTP thành công!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('Lỗi', result.message || 'Xác thực OTP thất bại');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      const result = await authApi.resendOtp(email);
      if (result.success) {
        Alert.alert('Thành công', 'Mã OTP mới đã được gửi đến email của bạn');
      } else {
        Alert.alert('Lỗi', result.message || 'Gửi lại OTP thất bại');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setResending(false);
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

        <Text style={styles.title}>Xác thực OTP</Text>
        <Text style={styles.subtitle}>
          Mã OTP đã được gửi đến email{' '}
          <Text style={{ fontWeight: '700' }}>{email}</Text>
        </Text>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.otpInput}
            placeholder="Nhập mã OTP"
            value={otpCode}
            onChangeText={setOtpCode}
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor={RHSColors.textMuted}
          />

          <TouchableOpacity
            style={[styles.verifyBtn, otpCode.length > 0 && styles.verifyBtnActive]}
            disabled={!otpCode || loading}
            onPress={handleVerifyOtp}
          >
            {loading ? (
              <ActivityIndicator color={RHSColors.white} />
            ) : (
              <Text style={[styles.verifyBtnText, otpCode.length > 0 && styles.verifyBtnTextActive]}>
                Xác thực
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendBtn} onPress={handleResendOtp} disabled={resending}>
            {resending ? (
              <ActivityIndicator size="small" color={RHSColors.govBlue} />
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
  otpInput: {
    backgroundColor: RHSColors.surface,
    borderWidth: 1.5,
    borderColor: RHSColors.border,
    borderRadius: 12,
    height: 52,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 8,
    color: RHSColors.text,
    marginBottom: 20,
  },
  verifyBtn: {
    backgroundColor: RHSColors.surface,
    height: 52,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyBtnActive: { backgroundColor: RHSColors.govBlue },
  verifyBtnText: { fontSize: 16, fontWeight: '600', color: RHSColors.textMuted },
  verifyBtnTextActive: { color: RHSColors.white },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: RHSColors.govBlue,
    textDecorationLine: 'underline',
  },
});