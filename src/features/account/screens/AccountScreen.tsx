import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RHSColors, borderRadius, shadows, typography } from '../../../lib/theme';
import { RHSLogo } from '../../../lib/Logo';
import { getToken, getRefreshToken, clearTokens } from '../../../lib/tokenStorage';
import { userApi } from '../../user/api/userApi';
import { UserProfileDto } from '../../user/types/user';
import { enableBiometric, disableBiometric, isBiometricEnabled } from '../../../lib/biometricService';

export const AccountScreen = () => {
  const navigation = useNavigation<any>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);

  // States cho các công tắc cài đặt
  const [pushEnabled, setPushEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      checkAuthStatus();
    }, [])
  );

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const accessToken = await getToken();
      if (accessToken) {
        setIsLoggedIn(true);
        await loadProfile();
        const bioEnabled = await isBiometricEnabled();
        setBiometricEnabled(bioEnabled);
      } else {
        setIsLoggedIn(false);
        setProfile(null);
      }
    } catch {
      setIsLoggedIn(false);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const result = await userApi.getProfile();
      if (result.success && result.user) {
        setProfile(result.user);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      const refreshToken = await getRefreshToken();
      if (!refreshToken || !profile?.email) {
        Alert.alert('Lỗi', 'Không tìm thấy dữ liệu xác thực. Vui lòng đăng nhập lại.');
        return;
      }
      const result = await enableBiometric(profile.email, refreshToken);
      if (result.success) {
        setBiometricEnabled(true);
      } else {
        Alert.alert('Không thể bật', result.error || 'Thiết bị không hỗ trợ sinh trắc học.');
      }
    } else {
      await disableBiometric();
      setBiometricEnabled(false);
    }
  };

  const handleLogin = () => navigation.navigate('Auth', { screen: 'Login' });
  
  const confirmLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: handleLogout },
      ]
    );
  };

  const handleLogout = async () => {
    await clearTokens();
    setIsLoggedIn(false);
    setProfile(null);
    setBiometricEnabled(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RHSColors.blue700} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Brand bar stripes */}
      <View style={styles.brandBar}>
        <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.red600 }]} />
        <View style={[styles.stripe, { flex: 0.4, backgroundColor: RHSColors.amber600 }]} />
        <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.blue700 }]} />
      </View>

      {/* Header gradient */}
      <LinearGradient
        colors={['#0A3A85', '#1565C0', '#1E88E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBg}
      >
        <RHSLogo size={36} />
        <Text style={styles.headerTitle}>RHS Platform</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Khối Profile hoặc Đăng nhập */}
        {!isLoggedIn ? (
          <View style={styles.loginCard}>
            <View style={styles.loginAvatarCircle}>
              <Feather name="user" size={44} color={RHSColors.blue700} />
            </View>
            <Text style={styles.loginTitle}>Chào mừng Công dân!</Text>
            <Text style={styles.loginSub}>
              Vui lòng xác thực tài khoản để thực hiện các thủ tục hành chính về nhà ở xã hội tại địa phương.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} activeOpacity={0.85}>
              <Feather name="log-in" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Đăng nhập tài khoản</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Auth', { screen: 'Register' })} style={styles.linkBtn}>
              <Text style={styles.linkText}>Đăng ký tài khoản công dân mới</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.profileCard}>
            {profile?.profileImageUrl ? (
              <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {profile?.fullName?.charAt(0)?.toUpperCase() || 'C'}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {profile?.fullName?.toUpperCase() || 'CÔNG DÂN'}
              </Text>
              <Text style={styles.profileId}>
                Mã định danh (CCCD): <Text style={styles.profileIdNumber}>{profile?.citizenId || 'Chưa cập nhật'}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Các chức năng chỉ hiện khi đã đăng nhập */}
        {isLoggedIn && (
          <>
            {/* Section 1: THÔNG TIN CÁ NHÂN */}
            <View style={styles.menuCard}>
              <Text style={styles.menuTitle}>THÔNG TIN CÁ NHÂN</Text>
              <MenuItem 
                icon="user" 
                label="Thông tin công dân" 
                onPress={() => navigation.navigate('UserProfile')} 
              />
              <MenuItem 
                icon="map-pin" 
                label="Sổ địa chỉ thường trú" 
                onPress={() => navigation.navigate('AddressBook')} 
                last 
              />
            </View>

            {/* Section 2: BẢO MẬT & TÀI KHOẢN */}
            <View style={styles.menuCard}>
              <Text style={styles.menuTitle}>BẢO MẬT & TÀI KHOẢN</Text>
              <MenuItem 
                icon="lock" 
                label="Đổi mật khẩu" 
                onPress={() => navigation.getParent()?.navigate('UserProfile', { screen: 'ChangePassword' })} 
              />
              <MenuItem 
                icon="bell" 
                label="Nhận thông báo dịch vụ" 
                rightComponent={
                  <Switch 
                    value={pushEnabled} 
                    onValueChange={setPushEnabled}
                    trackColor={{ false: '#D1D5DB', true: RHSColors.blue700 }}
                  />
                }
              />
              <MenuItem 
                iconSource={require('../../../../assets/fingerprint.png')}
                icon=""
                label="Xác thực sinh trắc học" 
                rightComponent={
                  <Switch 
                    value={biometricEnabled} 
                    onValueChange={handleBiometricToggle}
                    trackColor={{ false: '#D1D5DB', true: RHSColors.blue700 }}
                  />
                }
                last 
              />
            </View>
          </>
        )}

        {/* Section 3: TRỢ GIÚP & PHÁP LÝ (Luôn hiện) */}
        <View style={styles.menuCard}>
          <Text style={styles.menuTitle}>TRỢ GIÚP & PHÁP LÝ</Text>
          <MenuItem 
            icon="file-text" 
            label="Tra cứu thủ tục hành chính" 
            onPress={() => navigation.navigate('Faq')} 
          />
          <MenuItem 
            icon="shield" 
            label="Chính sách bảo mật dữ liệu" 
            onPress={() => navigation.navigate('Policy')} 
          />
          <MenuItem 
            icon="info" 
            label="Thông tin đơn vị quản lý" 
            rightComponent={<Text style={styles.versionText}>v1.0.0</Text>}
            last 
          />
        </View>

        {/* Section Logout */}
        {isLoggedIn && (
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={confirmLogout}
            activeOpacity={0.8}
          >
            <Feather name="log-out" size={18} color={RHSColors.red600} />
            <Text style={styles.logoutText}>Đăng xuất khỏi hệ thống</Text>
          </TouchableOpacity>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <RHSLogo size={20} />
          <Text style={styles.footerText}>Hệ thống Quản lý Nhà ở xã hội {'\n'}Phục vụ công dân số</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Menu Item Component ─────────────────────────────────────────
const MenuItem = ({
  icon,
  iconSource,
  label,
  onPress,
  rightComponent,
  last,
}: {
  icon: string;
  iconSource?: any;
  label: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode; 
  last?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.menuItem, last && { borderBottomWidth: 0 }]}
    onPress={onPress}
    activeOpacity={onPress ? 0.6 : 1}
    disabled={!onPress}
  >
    <View style={styles.menuIconWrap}>
      {iconSource ? (
        <Image source={iconSource} style={styles.menuIconImage} />
      ) : (
        <Feather name={icon as any} size={18} color={RHSColors.blue700} />
      )}
    </View>
    <Text style={styles.menuLabel}>{label}</Text>
    
    {rightComponent ? rightComponent : <Feather name="chevron-right" size={18} color={RHSColors.grey400} />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  brandBar: { flexDirection: 'row', height: 4 },
  stripe: { height: '100%' },
  headerBg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40, paddingTop: 16 },

  // ── Login card ──
  loginCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 28,
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  loginAvatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: RHSColors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginTitle: { ...typography.h2, color: RHSColors.text, marginBottom: 8 },
  loginSub: { ...typography.bodySmall, color: RHSColors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 10 },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: RHSColors.blue700,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
  },
  primaryBtnText: { ...typography.button, color: '#fff' },
  linkBtn: { paddingVertical: 4 },
  linkText: { ...typography.bodySmall, color: RHSColors.blue700, fontWeight: '600' },

  // ── Profile card ──
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: RHSColors.grey200,
    ...shadows.sm,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: RHSColors.grey100,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: RHSColors.blue700,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarInitial: { fontSize: 24, fontWeight: '800', color: '#fff' },
  profileInfo: { flex: 1, justifyContent: 'center' },
  profileName: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: RHSColors.text, 
    marginBottom: 4 
  },
  profileId: { 
    fontSize: 13, 
    color: RHSColors.textSecondary 
  },
  profileIdNumber: {
    fontWeight: '700',
    color: RHSColors.text,
  },

  // ── Menu Sections ──
  menuCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: RHSColors.grey200,
    overflow: 'hidden',
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: RHSColors.textMuted,
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.grey100,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.grey100,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: RHSColors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIconImage: { width: 18, height: 18, resizeMode: 'contain' },
  menuLabel: { flex: 1, fontSize: 15, color: RHSColors.text, fontWeight: '500' },
  versionText: { fontSize: 13, color: RHSColors.textMuted, fontWeight: '500' },

  // ── Nút Đăng Xuất ──
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: RHSColors.red400,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: RHSColors.red600,
    marginLeft: 8,
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    color: RHSColors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});