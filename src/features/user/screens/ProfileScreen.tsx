import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RHSColors } from '../../../lib/theme';

import { userApi, UserProfileDto } from '../api/userApi';

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    setLoading(true);
    try {
      const result = await userApi.getProfile();
      if (result.success && result.user) {
        setProfile(result.user);
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể tải thông tin người dùng');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = async () => {
    setUploading(true);
    try {
      const result = await userApi.uploadProfileImage('https://example.com/avatar.jpg');
      if (result.success) {
        Alert.alert('Thành công', 'Upload ảnh đại diện thành công');
        loadProfile();
      } else {
        Alert.alert('Lỗi', result.message || 'Upload thất bại');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RHSColors.govBlue} />
        </View>
      </SafeAreaView>
    );
  }

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
          <Feather name="arrow-left" size={24} color={RHSColors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Feather name="edit-2" color={RHSColors.white} size={18} />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.container}>
        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          {profile?.profileImageUrl ? (
            <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {profile?.fullName?.charAt(0) || 'U'}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadImage} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color={RHSColors.govBlue} />
            ) : (
              <Feather name="camera" color={RHSColors.white} size={16} />
            )}
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <InfoRow label="Họ tên" value={profile?.fullName || 'Chưa cập nhật'} />
          <InfoRow label="Email" value={profile?.email || 'Chưa cập nhật'} />
          <InfoRow label="Số điện thoại" value={profile?.phoneNumber || 'Chưa cập nhật'} />
          <InfoRow label="Vai trò" value={profile?.role || 'Applicant'} />
          <InfoRow
            label="Trạng thái email"
            value={profile?.isEmailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
            isHighlight={profile?.isEmailVerified}
            last
          />
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <Feather name="lock" color={RHSColors.govBlue} size={20} />
          <Text style={styles.actionBtnText}>Đổi mật khẩu</Text>
          <Feather name="chevron-right" color={RHSColors.textMuted} size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => navigation.navigate('DeleteAccount')}
        >
          <Feather name="trash-2" color={RHSColors.govRed} size={20} />
          <Text style={[styles.actionBtnText, { color: RHSColors.govRed }]}>Xóa tài khoản</Text>
          <Feather name="chevron-right" color={RHSColors.textMuted} size={20} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const InfoRow = ({ label, value, isHighlight, last }: {
  label: string;
  value: string;
  isHighlight?: boolean;
  last?: boolean;
}) => (
  <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[
      styles.infoValue,
      isHighlight === true && { color: RHSColors.govGreen },
      isHighlight === false && { color: RHSColors.govRed },
    ]}>
      {value}
    </Text>
  </View>
);

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
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: RHSColors.white,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: RHSColors.surface,
  },
  avatarCard: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: RHSColors.white,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: RHSColors.govBlue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: RHSColors.white,
    shadowColor: RHSColors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: RHSColors.white,
  },
  uploadBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: RHSColors.govBlue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: RHSColors.white,
  },
  infoCard: {
    backgroundColor: RHSColors.white,
    borderRadius: 16,
    paddingHorizontal: 4,
    marginBottom: 16,
    shadowColor: RHSColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.surface,
  },
  infoLabel: {
    fontSize: 14,
    color: RHSColors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: RHSColors.text,
    maxWidth: '55%',
    textAlign: 'right',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RHSColors.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: RHSColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: RHSColors.govBlue,
    marginLeft: 12,
  },
  deleteBtn: {
    marginBottom: 30,
  },
});