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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RHSColors } from '../../../lib/theme';
import { RHSLogo } from '../../../lib/Logo';

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={RHSColors.govBlue} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.brandBar}>
        <View style={styles.brandBarStripeRed} />
        <View style={styles.brandBarStripeGold} />
        <View style={styles.brandBarStripeBlue} />
      </View>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Feather name="edit-2" color={RHSColors.govBlue} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
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
                <Feather name="camera" color={RHSColors.text} size={18} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Họ tên</Text>
              <Text style={styles.infoValue}>{profile?.fullName || 'Chưa cập nhật'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile?.email || 'Chưa cập nhật'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>{profile?.phoneNumber || 'Chưa cập nhật'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vai trò</Text>
              <Text style={styles.infoValue}>{profile?.role || 'Applicant'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Trạng thái email</Text>
              <Text style={[styles.infoValue,
                profile?.isEmailVerified ? styles.verifiedText : styles.unverifiedText
              ]}>
                {profile?.isEmailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <Feather name="lock" color={RHSColors.govBlue} size={20} />
          <Text style={styles.actionBtnText}>Đổi mật khẩu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteAccountBtn]}
          onPress={() => navigation.navigate('DeleteAccount')}
        >
          <Feather name="trash-2" color={RHSColors.govRed} size={20} />
          <Text style={[styles.actionBtnText, { color: RHSColors.govRed }]}>Xóa tài khoản</Text>
        </TouchableOpacity>
      </View>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: RHSColors.text,
  },
  editButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: RHSColors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  profileContainer: {
    flex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: RHSColors.govBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: RHSColors.white,
  },
  uploadBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: RHSColors.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RHSColors.border,
  },
  infoContainer: {
    backgroundColor: RHSColors.surface,
    borderRadius: 16,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: RHSColors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: RHSColors.text,
  },
  verifiedText: {
    color: RHSColors.govGreen,
  },
  unverifiedText: {
    color: RHSColors.govRed,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RHSColors.surface,
    height: 52,
    borderRadius: 12,
    marginBottom: 16,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: RHSColors.govBlue,
    marginLeft: 8,
  },
  deleteAccountBtn: {
    backgroundColor: '#FDF2F2',
  },
});