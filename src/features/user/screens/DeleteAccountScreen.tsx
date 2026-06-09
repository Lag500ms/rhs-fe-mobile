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
    if (!validateForm()) return;

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
          <Feather name="arrow-left" color={RHSColors.white} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xóa tài khoản</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.warningCard}>
            <View style={styles.warningIconWrap}>
              <Feather name="alert-triangle" size={32} color={RHSColors.govRed} />
            </View>
            <Text style={styles.warningTitle}>Bạn có chắc chắn?</Text>
            <Text style={styles.warningDesc}>
              Hành động này sẽ xóa vĩnh viễn tài khoản và toàn bộ dữ liệu liên quan. Bạn sẽ không thể khôi phục lại được.
            </Text>
          </View>

          <View style={styles.formCard}>
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
            />
            <TouchableOpacity
              style={[styles.deleteBtn, isSubmitEnabled && styles.deleteBtnActive]}
              disabled={!isSubmitEnabled || loading}
              onPress={handleDeleteAccount}
            >
              {loading ? (
                <ActivityIndicator color={RHSColors.white} />
              ) : (
                <Text style={styles.deleteBtnText}>
                  {isSubmitEnabled ? 'Xóa tài khoản' : 'Nhập mật khẩu để xác nhận'}
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
  warningCard: {
    backgroundColor: '#fff5f5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  warningIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: RHSColors.govRed,
    marginBottom: 8,
  },
  warningDesc: {
    fontSize: 14,
    color: RHSColors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
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
  deleteBtn: {
    backgroundColor: RHSColors.surface,
    height: 52,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  deleteBtnActive: {
    backgroundColor: RHSColors.govRed,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: RHSColors.textMuted,
  },
});