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
import { useNavigation, useRoute } from '@react-navigation/native';
import { RHSColors } from '../../../lib/theme';

import { CustomInput } from '../../auth/components/CustomInput';
import { userApi, UpdateProfileDto, UserProfileDto } from '../api/userApi';

export const EditProfileScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const existingProfile: UserProfileDto | undefined = route.params?.profile;

  const [fullName] = useState(existingProfile?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(existingProfile?.phoneNumber || '');
  const [address] = useState(existingProfile?.address || '');
  const [dateOfBirth] = useState(
    existingProfile?.dateOfBirth
      ? existingProfile.dateOfBirth.split('T')[0]
      : ''
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }
    setLoading(true);
    try {
      const updateData: UpdateProfileDto = {
        fullName,
        phoneNumber: phoneNumber || undefined,
        address: address || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
      };
      const result = await userApi.updateProfile(updateData);
      if (result.success) {
        Alert.alert('Thành công', 'Cập nhật số điện thoại thành công', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Lỗi', result.message || 'Cập nhật thất bại');
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
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <View style={styles.ekycBadge}>
              <Feather name="check-circle" size={14} color={RHSColors.green600} />
              <Text style={styles.ekycBadgeText}>
                Họ tên & Ngày sinh được đồng bộ từ eKYC. Chỉ số điện thoại có thể thay đổi.
              </Text>
            </View>

            <View style={styles.lockedField}>
              <View style={styles.lockedLabelRow}>
                <Feather name="user" size={16} color={RHSColors.textMuted} />
                <Text style={styles.lockedLabel}>Họ và tên</Text>
              </View>
              <Text style={styles.lockedValue}>{fullName || '—'}</Text>
            </View>

            <View style={styles.lockedField}>
              <View style={styles.lockedLabelRow}>
                <Feather name="calendar" size={16} color={RHSColors.textMuted} />
                <Text style={styles.lockedLabel}>Ngày sinh</Text>
              </View>
              <Text style={styles.lockedValue}>{dateOfBirth || '—'}</Text>
            </View>

            <View style={styles.lockedField}>
              <View style={styles.lockedLabelRow}>
                <Feather name="map-pin" size={16} color={RHSColors.textMuted} />
                <Text style={styles.lockedLabel}>Địa chỉ</Text>
              </View>
              <Text style={styles.lockedValue}>{address || '—'}</Text>
            </View>

            <View style={styles.divider} />

            <CustomInput
              iconName="phone"
              placeholder="Số điện thoại *"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={styles.saveBtn}
              disabled={loading}
              onPress={handleSave}
            >
              {loading ? (
                <ActivityIndicator color={RHSColors.white} />
              ) : (
                <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
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
  ekycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.green50,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  ekycBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: RHSColors.green700,
    flex: 1,
    lineHeight: 16,
  },
  lockedField: {
    backgroundColor: RHSColors.grey100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RHSColors.grey200,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  lockedLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  lockedLabel: {
    fontSize: 12,
    color: RHSColors.textMuted,
    fontWeight: '500',
  },
  lockedValue: {
    fontSize: 15,
    fontWeight: '600',
    color: RHSColors.text,
    marginLeft: 24,
  },
  divider: {
    height: 1,
    backgroundColor: RHSColors.grey200,
    marginVertical: 16,
  },  saveBtn: {
    backgroundColor: RHSColors.govBlue,
    height: 52,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: RHSColors.white,
  },
});
