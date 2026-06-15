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
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RHSColors, borderRadius, shadows, typography, spacing } from '../../../lib/theme';
import { userApi, UserProfileDto } from '../api/userApi';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { ActionButton } from '../../../components/ActionButton';
import { InfoRow } from '../../../components/InfoRow';

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
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

  const getMimeTypeFromUri = (uri: string): string => {
    const ext = uri.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg': case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'gif': return 'image/gif';
      case 'webp': return 'image/webp';
      case 'heic': return 'image/heic';
      case 'heif': return 'image/heif';
      default: return 'image/jpeg';
    }
  };

  const pickImage = async (fromCamera: boolean): Promise<{ uri: string; type: string; fileName: string } | null> => {
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8 });

    if (result.canceled || !result.assets || result.assets.length === 0) return null;

    const asset = result.assets[0];
    const uri = asset.uri;
    const mimeType = getMimeTypeFromUri(uri);
    const fileName = asset.fileName || `profile_${Date.now()}.${mimeType.split('/')[1]}`;
    return { uri, type: mimeType, fileName };
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
      { text: 'Chụp ảnh', onPress: async () => {
        if (!(await requestCameraPermission())) return;
        const asset = await pickImage(true);
        if (asset) await uploadImage(asset);
      }},
      { text: 'Chọn từ thư viện', onPress: async () => {
        if (!(await requestMediaPermission())) return;
        const asset = await pickImage(false);
        if (asset) await uploadImage(asset);
      }},
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const isVerified = !!profile?.citizenId;

  const handleVerifyIdentity = () => {
    if (isVerified) {
      Alert.alert('Thông báo', 'Bạn đã xác minh danh tính thành công rồi.');
      return;
    }
    navigation.getParent()?.navigate('EKyc');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Hồ sơ cá nhân" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Hồ sơ cá nhân"
        rightAction={
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile', { profile })}>
            <Feather name="edit-2" size={15} color="#fff" style={{ marginRight: 4 }} />
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Sửa</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarWrapper}>
            {profile?.profileImageUrl ? (
              <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{profile?.fullName?.charAt(0) || 'U'}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadImage} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="camera" size={14} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <InfoRow label="Họ tên" value={profile?.fullName || 'Chưa cập nhật'} />
          <InfoRow label="Email" value={profile?.email || 'Chưa cập nhật'} />
          <InfoRow label="Số điện thoại" value={profile?.phoneNumber || 'Chưa cập nhật'} />
          <InfoRow label="Địa chỉ" value={profile?.address || 'Chưa cập nhật'} />
          <InfoRow
            label="Ngày sinh"
            value={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
          />
          <InfoRow label="Số CCCD" value={profile?.citizenId || 'Chưa cập nhật'} />
          <InfoRow
            label="Trạng thái email"
            value={profile?.isEmailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
            isHighlight={profile?.isEmailVerified}
            last
          />
        </View>

        {/* Actions */}
        <ActionButton icon="lock" text="Đổi mật khẩu" onPress={() => navigation.navigate('ChangePassword')} />

        <ActionButton
          icon="shield"
          text={isVerified ? 'Đã xác minh danh tính' : 'Xác minh danh tính'}
          color={isVerified ? RHSColors.green600 : RHSColors.amber700}
          leftBorderColor={isVerified ? RHSColors.green600 : RHSColors.amber700}
          showChevron={!isVerified}
          onPress={handleVerifyIdentity}
        />

        <ActionButton icon="trash-2" text="Xóa tài khoản" isDestructive onPress={() => navigation.navigate('DeleteAccount')} last />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: RHSColors.surface },

  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Avatar
  avatarCard: { alignItems: 'center', marginTop: 20, marginBottom: 20 },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: RHSColors.white,
    ...shadows.md,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: RHSColors.blue700,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: RHSColors.white,
    ...shadows.md,
  },
  avatarInitial: { fontSize: 36, fontWeight: '800', color: '#fff' },
  uploadBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: RHSColors.blue700,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: RHSColors.white,
  },

  // Info
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    paddingHorizontal: 4,
    marginBottom: 16,
    ...shadows.md,
  },
});