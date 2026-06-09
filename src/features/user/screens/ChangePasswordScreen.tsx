import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { RHSColors } from '../../../lib/theme';

import { CustomInput } from '../../auth/components/CustomInput';
import { authApi } from '../../auth/api/authApi';

export const ChangePasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasInteracted, setHasInteracted] = useState<{ [key: string]: boolean }>({});

  const isSubmitEnabled = currentPassword.length > 0 && newPassword.length >= 6 && confirmPassword.length >= 6;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!currentPassword) newErrors.currentPassword = 'Mật khẩu hiện tại là bắt buộc';
    if (!newPassword) {
      newErrors.newPassword = 'Mật khẩu mới là bắt buộc';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    setHasInteracted({ currentPassword: true, newPassword: true, confirmPassword: true });
    if (!validateForm()) return;
    setLoading(true);
    try {
      const result = await authApi.changePassword({
        currentPassword, newPassword, confirmPassword,
      });
      if (result.success) {
        Alert.alert('Thành công', 'Đổi mật khẩu thành công', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Lỗi', result.message || 'Đổi mật khẩu thất bại');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.brandBar}>
        <View style={styles.brandBarStripeRed} />
        <View style={styles.brandBarStripeGold} />
        <View style={styles.brandBarStripeBlue} />
      </View>
      <LinearGradient
        colors={[RHSColors.govBlueDark, RHSColors.govBlue, RHSColors.govTeal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="x" color={RHSColors.white} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <CustomInput
              iconName="lock"
              placeholder="Mật khẩu hiện tại"
              secureTextEntry
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                setHasInteracted({ ...hasInteracted, currentPassword: false });
              }}
              errorMessage={hasInteracted.currentPassword ? errors.currentPassword : undefined}
            />
            <CustomInput
              iconName="lock"
              placeholder="Mật khẩu mới"
              secureTextEntry
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setHasInteracted({ ...hasInteracted, newPassword: false });
              }}
              errorMessage={hasInteracted.newPassword ? errors.newPassword : undefined}
            />
            <CustomInput
              iconName="lock"
              placeholder="Xác nhận mật khẩu mới"
              secureTextEntry
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setHasInteracted({ ...hasInteracted, confirmPassword: false });
              }}
              errorMessage={hasInteracted.confirmPassword ? errors.confirmPassword : undefined}
            />
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitEnabled && styles.submitBtnActive]}
              disabled={!isSubmitEnabled || loading}
              onPress={handleChangePassword}
            >
              {loading ? (
                <ActivityIndicator color={RHSColors.white} />
              ) : (
                <Text style={[styles.submitBtnText, isSubmitEnabled && styles.submitBtnTextActive]}>
                  Đổi mật khẩu
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: RHSColors.surface,
  },
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: RHSColors.white,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formCard: {
    backgroundColor: RHSColors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: RHSColors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  submitBtn: {
    backgroundColor: RHSColors.surface,
    height: 52,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnActive: {
    backgroundColor: RHSColors.govBlue,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: RHSColors.textMuted,
  },
  submitBtnTextActive: {
    color: RHSColors.white,
  },
});