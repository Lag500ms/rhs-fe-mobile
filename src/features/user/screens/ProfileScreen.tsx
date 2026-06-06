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
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
            <Feather name="edit-2" color="#000000" size={24} />
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
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Feather name="camera" color="#000000" size={20} />
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
          <Feather name="lock" color="#000000" size={20} />
          <Text style={styles.actionBtnText}>Đổi mật khẩu</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, styles.deleteAccountBtn]}
          onPress={() => navigation.navigate('DeleteAccount')}
        >
          <Feather name="trash-2" color="#D93843" size={20} />
          <Text style={[styles.actionBtnText, styles.deleteAccountText]}>Xóa tài khoản</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
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
    color: '#000000',
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
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  uploadBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  infoContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  verifiedText: {
    color: '#34C759',
  },
  unverifiedText: {
    color: '#D93843',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    height: 52,
    borderRadius: 25,
    marginBottom: 16,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  deleteAccountBtn: {
    backgroundColor: '#FDF2F2',
  },
  deleteAccountText: {
    color: '#D93843',
  },
});