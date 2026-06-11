import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RHSColors } from '../../../lib/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

import { userApi, UserProfileDto } from '../api/userApi';
import { BrandBar } from '../../../components/BrandBar';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { ActionButton } from '../../../components/ActionButton';
import { InfoRow } from '../../../components/InfoRow';

const VERIFIED_KEY = 'identityVerified';

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useFocusEffect(
    useCallback(() => {
      checkVerifiedStatus();
      loadProfile();
    }, [])
  );

  const checkVerifiedStatus = async () => {
    try {
      const verified = await AsyncStorage.getItem(VERIFIED_KEY);
      setIsVerified(verified === 'true');
    } catch {}
  };

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

  const requestMediaPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh đại diện.');
        return false;
      }
    }
    return true;
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Ứng dụng cần quyền truy cập camera để chụp ảnh đại diện.');
        return false;
      }
    }
    return true;
  };

  const pickImageFromGallery = async (): Promise<{ uri: string; type: string; fileName: string } | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }
    const asset = result.assets[0];
    const uri = asset.uri;
    const fileType = asset.type || 'image/jpeg';
    const mimeType = fileType.startsWith('image/') ? fileType : 'image/jpeg';
    return {
      uri,
      type: mimeType,
      fileName: asset.fileName || `profile_${Date.now()}.jpg`,
    };
  };

  const pickImageFromCamera = async (): Promise<{ uri: string; type: string; fileName: string } | null> => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }
    const asset = result.assets[0];
    const fileType = asset.type || 'image/jpeg';
    const mimeType = fileType.startsWith('image/') ? fileType : 'image/jpeg';
    return {
      uri: asset.uri,
      type: mimeType,
      fileName: asset.fileName || `profile_${Date.now()}.jpg`,
    };
  };

  const uploadImage = async (asset: { uri: string; type: string; fileName: string }) => {
    setUploading(true);
    try {
      const result = await userApi.uploadProfileImage(asset);
      if (result.success) {
        Alert.alert('Thành công', 'Upload ảnh đại diện thành công');
        loadProfile();
      } else {
        Alert.alert('Lỗi', result.message || 'Upload thất bại');
      }
    } catch (error: any) {
      const status = error.response?.status;
      const serverMsg = error.response?.data?.message || error.response?.data?.title;
      const detailMsg = error.message;
      const finalMsg = serverMsg || detailMsg || 'Không thể kết nối đến máy chủ';
      Alert.alert(`Lỗi${status ? ` (${status})` : ''}`, finalMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadImage = () => {
    Alert.alert('Chọn ảnh đại diện', 'Vui lòng chọn nguồn ảnh', [
      {
        text: 'Chụp ảnh',
        onPress: async () => {
          const hasPermission = await requestCameraPermission();
          if (!hasPermission) return;
          const asset = await pickImageFromCamera();
          if (asset) await uploadImage(asset);
        },
      },
      {
        text: 'Chọn từ thư viện',
        onPress: async () => {
          const hasPermission = await requestMediaPermission();
          if (!hasPermission) return;
          const asset = await pickImageFromGallery();
          if (asset) await uploadImage(asset);
        },
      },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const handleVerifyIdentity = () => {
    navigation.getParent()?.navigate('EKyc');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <BrandBar />
        <ScreenHeader title="Hồ sơ cá nhân" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RHSColors.govBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <BrandBar />
      <ScreenHeader
        title="Hồ sơ cá nhân"
        rightAction={
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={{ color: '#fff', fontSize: 13 }}>Sửa</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
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
              <Text style={{ color: '#fff', fontSize: 16 }}>+</Text>
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
        <ActionButton
          icon="lock"
          text="Đổi mật khẩu"
          onPress={() => navigation.navigate('ChangePassword')}
        />

        <ActionButton
          icon="shield"
          text={isVerified ? 'Đã xác minh danh tính' : 'Xác minh danh tính'}
          color={isVerified ? RHSColors.govGreen : RHSColors.govGold}
          leftBorderColor={isVerified ? RHSColors.govGreen : RHSColors.govGold}
          showChevron={!isVerified}
          onPress={handleVerifyIdentity}
        />

        <ActionButton
          icon="trash-2"
          text="Xóa tài khoản"
          isDestructive
          onPress={() => navigation.navigate('DeleteAccount')}
          last
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: RHSColors.surface,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: RHSColors.surface,
  },
  editButton: {
    width: 52,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
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
});