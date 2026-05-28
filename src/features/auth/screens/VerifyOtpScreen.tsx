import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { setTokens } from '../../../lib/tokenStorage';
import { authApi } from '../api/authApi';

interface VerifyOtpRouteParams {
  email: string;
}

export const VerifyOtpScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { email } = route.params as VerifyOtpRouteParams;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(RNTextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ mã OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.verifyOtp({ email, otpCode });

      if (result.success && result.accessToken) {
        await setTokens(result.accessToken, result.refreshToken);
        Alert.alert('Thành công', 'Xác thực tài khoản thành công!', [
          { text: 'OK', onPress: () => navigation.navigate('MainTabs') },
        ]);
      } else {
        Alert.alert('Lỗi', result.message || 'Xác thực thất bại');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const result = await authApi.resendOtp(email);
      
      if (result.success) {
        setTimer(60);
        Alert.alert('Thành công', 'Mã OTP đã được gửi lại');
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể gửi lại mã OTP');
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

        <Text style={styles.title}>Xác thực tài khoản</Text>
        <Text style={styles.subtitle}>Nhập mã OTP đã gửi đến {email}</Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <RNTextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
            />
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.verifyBtn, loading && styles.verifyBtnDisabled]}
          disabled={loading}
          onPress={handleVerifyOtp}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.verifyBtnText}>Xác thực</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Không nhận được mã? </Text>
          {timer > 0 ? (
            <Text style={styles.timerText}>Gửi lại sau ({timer}s)</Text>
          ) : (
            <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
              <Text style={[styles.resendLink, loading && styles.resendLinkDisabled]}>Gửi lại</Text>
            </TouchableOpacity>
          )}
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  otpInputFilled: {
    borderColor: '#000000',
    backgroundColor: '#F8F8F8',
  },
  verifyBtn: {
    backgroundColor: '#000000',
    height: 52,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  verifyBtnDisabled: {
    backgroundColor: '#C7C7CC',
  },
  verifyBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#333333',
  },
  timerText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D93843',
    textDecorationLine: 'underline',
  },
  resendLinkDisabled: {
    color: '#8E8E93',
  },
});