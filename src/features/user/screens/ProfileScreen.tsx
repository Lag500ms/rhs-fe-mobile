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
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { RHSColors, borderRadius, shadows, typography, spacing } from '../../../lib/theme';
import { userApi } from '../api/userApi';
import { UserProfileDto } from '../types/user';
import { getToken } from '../../../lib/tokenStorage';
import { ActionButton } from '../../../components/ActionButton';
import { InfoRow } from '../../../components/InfoRow';

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useFocusEffect(
    useCallback(() => {
      checkAuthAndLoad();
    }, [])
  );

  const checkAuthAndLoad = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setIsLoggedIn(false);
        setProfile(null);
        setLoading(false);
        return;
      }
      
      setIsLoggedIn(true);
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

  const handleLoginPress = () => {
    navigation.navigate('Auth', { screen: 'Login', params: { returnTo: 'Account' } });
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
        checkAuthAndLoad();
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

  const renderNotLoggedIn = () => (
    <View style={styles.loginPromptCard}>
      <View style={styles.loginIconCircle}>
        <Feather name="user" size={40} color={RHSColors.govBlue} />
      </View>
      <Text style={styles.loginTitle}>Chưa đăng nhập</Text>
      <Text style={styles.loginDesc}>
        Vui lòng đăng nhập để xem hồ sơ cá nhân của bạn
      </Text>
      <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress} activeOpacity={0.85}>
        <Feather name="log-in" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.loginButtonText}>Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.brandBar}>
        <View style={styles.brandBarStripeRed} />
        <View style={styles.brandBarStripeGold} />
        <View style={styles.brandBarStripeBlue} />
      </View>
      <LinearGradient
        colors={[RHSColors.govBlueDark, RHSColors.govBlue, RHSColors.govTeal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Text style={styles.title}>Hồ sơ cá nhân</Text>
        <Text style={styles.subtitle}>
          {profile?.fullName || 'Thông tin tài khoản của bạn'}
        </Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : !isLoggedIn ? (
        <View style={styles.container}>
          {renderNotLoggedIn()}
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile', { profile })}>
            <Feather name="phone" size={15} color="#1565C0" style={{ marginRight: 4 }} />
            <Text style={{ color: '#1565C0', fontSize: 12, fontWeight: '700' }}>Sửa SĐT</Text>
          </TouchableOpacity>
        </View>
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
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: RHSColors.surface },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: RHSColors.textMuted,
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
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: RHSColors.white,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: RHSColors.blue50,
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

  // Login prompt
  loginPromptCard: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: RHSColors.white,
    borderRadius: 20,
    shadowColor: RHSColors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    width: '100%',
  },
  loginIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: RHSColors.text,
    marginBottom: 8,
  },
  loginDesc: {
    fontSize: 14,
    color: RHSColors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: RHSColors.blue700,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    ...shadows.md,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
