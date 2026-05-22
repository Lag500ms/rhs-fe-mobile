import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { CustomInput } from '../components/CustomInput';
import { Divider } from '../components/Divider';
import { SocialButton } from '../components/SocialButton';
import { authApi } from '../api/authApi';

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasInteracted, setHasInteracted] = useState<{ [key: string]: boolean }>({});

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

      if (result.success) {
        Alert.alert('Thành công', 'Đăng nhập thành công!', [
          { text: 'OK', onPress: () => navigation.navigate('MainTabs') },
        ]);
      } else {
        Alert.alert('Lỗi', result.message || 'Đăng nhập thất bại');
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
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Feather name="x" color="#000000" size={24} />
          </TouchableOpacity>
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
            style={[styles.loginBtn, isLoginEnabled && styles.loginBtnActive]}
            disabled={!isLoginEnabled || loading}
            onPress={handleLogin}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, paddingHorizontal: 24 },
  header: { marginTop: 16, marginBottom: 40 },
  closeButton: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    borderColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center',
  },
  title: {
    fontSize: 28, fontWeight: 'bold', color: '#000000', textAlign: 'center', marginBottom: 40,
  },
  formContainer: { marginBottom: 30 },
  loginBtn: {
    backgroundColor: '#F2F2F7', height: 52, borderRadius: 25, justifyContent: 'center', alignItems: 'center',
  },
  loginBtnActive: { backgroundColor: '#000000' },
  loginBtnText: { fontSize: 16, fontWeight: '600', color: '#8E8E93' },
  loginBtnTextActive: { color: '#FFFFFF' },
  forgotText: {
    fontSize: 14, color: '#D93843', textAlign: 'center', marginTop: 16,
    textDecorationLine: 'underline'
  },
  socialContainer: { alignItems: 'center', marginBottom: 30 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  footerText: { fontSize: 14, color: '#333333' },
  registerText: { fontSize: 14, fontWeight: '600', color: '#D93843', textDecorationLine: 'underline' },
});