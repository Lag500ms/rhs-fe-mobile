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

import { CustomInput } from '../../auth/components/CustomInput';
import { userApi } from '../api/userApi';

export const DeleteAccountScreen = () => {
  const navigation = useNavigation<any>();
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasInteracted, setHasInteracted] = useState<{ [key: string]: boolean }>({});

  const isSubmitEnabled = password.length > 0;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!password) {
      newErrors.password = 'Mật khẩu là bắt buộc để xác nhận';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDeleteAccount = async () => {
    setHasInteracted({ password: true });
    
    if (!validateForm()) {
      return;
    }

    Alert.alert(
      'Xác nhận xóa tài khoản',
      'Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await userApi.deleteAccount({ password, reason });

              if (result.success) {
                Alert.alert('Thành công', 'Tài khoản đã được xóa thành công', [
                  { text: 'OK', onPress: () => navigation.navigate('Auth') },
                ]);
              } else {
                Alert.alert('Lỗi', result.message || 'Xóa tài khoản thất bại');
              }
            } catch (error: any) {
              Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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

        <Text style={styles.title}>Xóa tài khoản</Text>
        <Text style={styles.subtitle}>Để xóa tài khoản, vui lòng nhập mật khẩu và lý do (tùy chọn)</Text>

        <View style={styles.formContainer}>
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

          <CustomInput
            iconName="message-circle"
            placeholder="Lý do (tùy chọn)"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity 
            style={[styles.deleteBtn, isSubmitEnabled && styles.deleteBtnActive]}
            disabled={!isSubmitEnabled || loading}
            onPress={handleDeleteAccount}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.deleteBtnText}>Xóa tài khoản</Text>
            )}
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
  backButton: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    borderColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center',
  },
  title: {
    fontSize: 28, fontWeight: 'bold', color: '#D93843', textAlign: 'center', marginBottom: 12,
  },
  subtitle: {
    fontSize: 14, color: '#666666', textAlign: 'center', marginBottom: 40,
  },
  formContainer: { marginBottom: 30 },
  deleteBtn: {
    backgroundColor: '#F2F2F7',
    height: 52,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  deleteBtnActive: { backgroundColor: '#D93843' },
  deleteBtnText: { fontSize: 16, fontWeight: '600', color: '#8E8E93' },
});